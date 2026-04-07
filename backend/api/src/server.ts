import app from "./app";
import { prisma } from "@db";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    // Verify DB connection before accepting traffic
    await prisma.$connect();
    console.log("✅  Database connected");

    app.listen(PORT, () => {
      console.log(`🚀  TenderSetu API running on http://localhost:${PORT}`);
      console.log(`    ENV: ${process.env.NODE_ENV ?? "development"}`);
    });
  } catch (err) {
    console.error("❌  Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("\n🛑  Server stopped");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
