import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import express from "express";
import materialsRouter from "./routes/materials";

dotenv.config();

const app = express();
// ensure PORT is a number (process.env.PORT is a string when present)
const PORT: number = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// configure uploads directory and multer
const uploadsDir = path.join(__dirname, "../public/uploads");
// const uploadsDir = path.resolve(process.cwd(), 'public/uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname) || "";
    cb(null, `${unique}${ext}`);
  },
});
const upload = multer({ storage });

app.use("/uploads", express.static(uploadsDir));
app.post("/upload", upload.array("files", 12), (req, res) => {
  const files = ((req as any).files as Express.Multer.File[]) || [];
  const defaultHost = `${req.protocol}://${req.get("host")}`;
  const host = (process.env.PUBLIC_HOST || defaultHost).replace(/\/$/, "");
//   const urls = files.map((f) => f.filename);
const urls = files.map((f) => `${host}/uploads/${f.filename}`);

  console.log("UPLOADED URLS = ", urls);

  res.json({ urls });
});
console.log("UPLOAD DIR = ", uploadsDir);

app.use("/materials", materialsRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
