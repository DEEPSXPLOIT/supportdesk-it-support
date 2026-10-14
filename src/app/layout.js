import Registry from "@/lib/registry";
import Providers from "@/components/Providers";
import { project } from "@/data/project";
export const metadata = {
  title: project.title + " | Jaideep Mahendra",
  description: project.description,
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <Registry>
          <Providers>{children}</Providers>
        </Registry>
      </body>
    </html>
  );
}
