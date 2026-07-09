import type { Metadata } from "next";
import "../../styles.css";
import "./app.css";

export const metadata: Metadata = {
  title: "内容排期管理系统",
  description: "脚本、剪辑、审核、排期、发布和库存的一体化管理系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
