import multer from "multer";
import { NextApiRequest, NextApiResponse } from "next";
import { parseCookies } from "nookies";
import { verifyToken } from "./verifyToken";
import { compressImage } from "./compressImage";
import { createRouter } from "next-connect";

interface User {
  id: string;
  type: string;
}

const upload = multer({ dest: "/tmp" });
const router = createRouter<NextApiRequest, NextApiResponse>();

router.use((req, res, next) =>
  upload.single("file")(req as any, res as any, next as any)
);
router.post(async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const cookies = parseCookies({ req });
  const token = cookies["token"];
  if (token) {
    try {
      const user = verifyToken(token) as User;

      const userType = user.type;
      const imageQuality = userType === "premium" ? false : true;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }
      const { path: filePath } = req.file;

      try {
        const processedBuffer = await compressImage(
          filePath,
          1000,
          1000,
          imageQuality
        );
        res.setHeader("Content-Type", "image/jpeg");
        res.send(processedBuffer);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error processing image" });
      }

    } catch (error) {
      console.error(error);
      res.status(401).json({ error: "Unauthorized or processing failed" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});
