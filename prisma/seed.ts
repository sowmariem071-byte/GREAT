import bcrypt from "bcryptjs";
import { PrismaClient, Role, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "zzb888";

const seedUsers = [
  { account: "gr", name: "龚锐", role: Role.ADMIN },
  { account: "hxy", name: "胡欣怡", role: Role.DIRECTOR },
  { account: "wx", name: "王煊", role: Role.DIRECTOR },
  { account: "sxx", name: "单萱萱", role: Role.DIRECTOR },
  { account: "hly", name: "贺玲玥", role: Role.EDITOR },
  { account: "hwq", name: "黄炜琪", role: Role.EDITOR },
];

async function upsertUser(account: string, name: string, role: Role) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const existingByName = await prisma.user.findFirst({ where: { name } });
  const existingByAccount = await prisma.user.findUnique({ where: { email: account } });

  if (existingByAccount && existingByName && existingByAccount.id !== existingByName.id) {
    throw new Error(`Cannot assign account ${account} to ${name}; it is already used by ${existingByAccount.name}.`);
  }

  if (existingByName) {
    return prisma.user.update({
      where: { id: existingByName.id },
      data: { email: account, name, role, status: UserStatus.ACTIVE, passwordHash },
    });
  }

  return prisma.user.create({
    data: { email: account, name, role, passwordHash },
  });
}

async function main() {
  await prisma.reviewAttachment.deleteMany();
  await prisma.reviewRound.deleteMany();
  await prisma.publishSchedule.deleteMany();
  await prisma.videoTask.deleteMany();
  await prisma.script.deleteMany();
  await prisma.dailyTarget.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();

  const [admin, huxinyi, wangxuan, shanxuanxuan, helingyue, huangweiqi] = await Promise.all(
    seedUsers.map((user) => upsertUser(user.account, user.name, user.role)),
  );

  await Promise.all([
    prisma.dailyTarget.create({
      data: { userId: huxinyi.id, chineseParentingScripts: 3, femaleScripts: 1 },
    }),
    prisma.dailyTarget.create({
      data: { userId: wangxuan.id, chineseParentingScripts: 3, femaleScripts: 1 },
    }),
    prisma.dailyTarget.create({
      data: { userId: shanxuanxuan.id, chineseParentingScripts: 3, femaleScripts: 0 },
    }),
    prisma.dailyTarget.create({
      data: { userId: helingyue.id, editingVideos: 6 },
    }),
    prisma.dailyTarget.create({
      data: { userId: huangweiqi.id, editingVideos: 6 },
    }),
  ]);

  console.log(`Seed complete. Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log(`Admin login: ${admin.email}`);
  console.log("Seed business data cleared: scripts, videos, reviews, schedules, notifications, and sessions are empty.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
