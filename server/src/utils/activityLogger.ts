import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Asynchronously logs user activities to the database.
 * * DESIGN PATTERN: Fire-and-Forget
 * This function intentionally catches and consumes its own errors.
 * We do not want a failure in the logging mechanism to crash or rollback
 * the primary business transaction (e.g., successfully updating a task).
 */
export const logActivity = async (
  userId: string | undefined,
  action: string,
  targetName: string,
  extraText: string | null = null,
  targetId: string | null = null,
): Promise<void> => {
  // Skip logging if the action is performed by an unauthenticated system/cron process
  if (!userId) return;

  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        targetName,
        extraText,
        targetId,
      },
    });
  } catch (error) {
    // Log to standard error for infrastructure monitoring tools (e.g., Datadog/PM2)
    // without throwing the exception back to the caller.
    console.error("Activity logging failed:", error);
  }
};
