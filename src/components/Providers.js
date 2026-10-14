"use client";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import { darkTheme } from "@/styles/theme";
const GlobalStyle = createGlobalStyle`*{box-sizing:border-box;margin:0;padding:0;}body{background:${({ theme }) => theme.colors.bg};color:${({ theme }) => theme.colors.text};font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;}h1,h2,h3{line-height:1.25;}a{text-decoration:none;}button{font:inherit;background:none;cursor:pointer;}input,select{font:inherit;}ul{list-style:none;}:focus-visible{outline:3px solid #60a5fa;outline-offset:4px;}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;}}`;
export default function Providers({ children }) {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
