import multer from "multer";
import path from "path";

// Carpeta de destino
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/reportes");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, name + ext);
  }
});

// Filtro: solo imágenes
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Solo se permiten imágenes"), false);
  }
  cb(null, true);
};

// Subir máximo 10 fotos por reporte
export const uploadReporte = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB por imagen
});
