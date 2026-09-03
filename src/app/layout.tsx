import "./globals.css";

export const metadata = {
  title: "Food Square Inventory",
  description: "Inventory & Expiry Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
