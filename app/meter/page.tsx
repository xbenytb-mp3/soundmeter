import SoundMeter from "@/components/SoundMeter";
import Navbar from "@/components/Navbar";

export default function MeterPage() {
  return (
    <>
      <Navbar />
      <main className="pt-4 pb-8">
        <h1 className="text-2xl font-bold text-center mb-4">Sound Meter</h1>
        <SoundMeter />
      </main>
    </>
  );
}
