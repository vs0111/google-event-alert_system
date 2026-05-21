import cron from "node-cron";

export const startCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      await fetch(
        "http://localhost:3000/api/cron"
      );

      console.log("Cron executed");
    } catch (error) {
      console.log(error);
    }
  });
};