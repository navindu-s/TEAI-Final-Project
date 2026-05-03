import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/layout/Shell";
import { Esp32Provider } from "./hooks/useEsp32";
import AuctionPrice from "./pages/AuctionPrice";
import DashboardHome from "./pages/DashboardHome";
import ForeignParticle from "./pages/ForeignParticle";
import PluckingQuality from "./pages/PluckingQuality";
import SystemLogs from "./pages/SystemLogs";
import VisionTaster from "./pages/VisionTaster";
import WitheringControl from "./pages/WitheringControl";

export default function App() {
  return (
    <Esp32Provider>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/vision-taster" element={<VisionTaster />} />
          <Route path="/plucking" element={<PluckingQuality />} />
          <Route path="/withering" element={<WitheringControl />} />
          <Route path="/foreign-particle" element={<ForeignParticle />} />
          <Route path="/auction-price" element={<AuctionPrice />} />
          <Route path="/logs" element={<SystemLogs />} />
        </Route>
      </Routes>
    </Esp32Provider>
  );
}
