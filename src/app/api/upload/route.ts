import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { MAX_PRODUCT_IMAGE_SIZE_BYTES } from "@/lib/catalog/constants";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen valida." },
        { status: 400 }
      );
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen debe pesar como maximo 8 MB." },
        { status: 400 }
      );
    }

    const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = requiredEnv("CLOUDINARY_API_KEY");
    const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `carousel/${Date.now()}-${crypto.randomUUID()}`;

    // Firma de parámetros para Cloudinary
    const signatureParams = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha1")
      .update(signatureParams)
      .digest("hex");

    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", new Blob([buffer], { type: file.type }), file.name || "carousel-image");
    cloudinaryForm.append("api_key", apiKey);
    cloudinaryForm.append("timestamp", String(timestamp));
    cloudinaryForm.append("public_id", publicId);
    cloudinaryForm.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryForm,
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json(
        { error: errData.error?.message || "Error al subir a Cloudinary" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      imageUrl: data.secure_url,
      imagePath: data.public_id,
    });
  } catch (error: any) {
    console.error("Error in upload api route:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
