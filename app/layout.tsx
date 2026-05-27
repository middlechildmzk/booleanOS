import "./globals.css";

export const metadata = {
  title: "BooleanOS",
  description: "AI sourcing query copilot for recruiters and sourcers"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
