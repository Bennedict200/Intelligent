import "./globals.css";
//import pdfQA from "./pdfQA"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* <NavSection/> */}
        {children}
      </body>
    </html>
  );
}
