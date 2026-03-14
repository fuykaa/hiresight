import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <div>
        <Navbar />
      </div>
      <div className="flex-1 overflow-auto">
        <main className="flex-1 overflow-auto">{children}</main>
        <div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
