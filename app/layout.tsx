import type { Metadata } from "next";
import { Lexend_Deca, Lexend_Zetta } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://odai.chat"),
  title: "ODAI Chat - AI Assistant",
  description: "Intelligent AI chat assistant powered by ODAI technology.",
};

export const viewport = {
  maximumScale: 1,
};

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend-deca",
  weight: ["300", "400", "500", "600", "700"],
});

const lexendZetta = Lexend_Zetta({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend-zetta",
  weight: ["300", "400", "500", "600", "700"],
});

const LIGHT_THEME_COLOR = "#D6FFA6";
const DARK_THEME_COLOR = "#111111";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${lexendDeca.variable} ${lexendZetta.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <Toaster position="top-center" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
