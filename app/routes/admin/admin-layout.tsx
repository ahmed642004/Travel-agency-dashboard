import { Outlet } from "react-router";
import pkg from "@syncfusion/ej2-react-navigations";
const { SidebarComponent } = pkg as typeof import("@syncfusion/ej2-react-navigations");

export default function AdminLayout() {
  return (
    <div>
      <div className="admin-layout">
        MobileSidebar
        <aside className="w-full max-w-[270px] hidden lg:block">
            <SidebarComponent width={270} enableGestures={false}>
            </SidebarComponent>
        </aside>
        <aside className="children"><Outlet /></aside>
      </div>
    </div>
  );
}
