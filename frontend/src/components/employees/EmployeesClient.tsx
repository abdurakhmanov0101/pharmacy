'use client';

import { useState, useEffect, useRef } from "react";
import { Plus, Users, Search, AlertCircle, Camera, Upload, CheckCircle2, X } from "lucide-react";
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';

export default function EmployeesClient() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("Umumiy");
  const [salary, setSalary] = useState("0");
  const [contactInfo, setContactInfo] = useState("");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("18:00");
  
  // Face Capture State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [captureStatus, setCaptureStatus] = useState<"idle" | "capturing" | "success" | "error">("idle");
  const [captureMessage, setCaptureMessage] = useState("");

  useEffect(() => {
    fetchEmployees();
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      await tf.ready();
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setModelsLoaded(true);
    } catch (err) {
      console.error("Model yuklashda xatolik:", err);
      setError("AI modellarini yuklab bo'lmadi. Face ID ishlamasligi mumkin.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCaptureMessage("Qurilmada kamera topilmadi yoki ruxsat yo'q.");
        setCaptureStatus("error");
        return;
      }
      
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, 
          audio: false 
        });
      } catch (e) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera err", err);
      setCaptureMessage("Kameraga ulanib bo'lmadi.");
      setCaptureStatus("error");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    
    setCaptureStatus("capturing");
    setCaptureMessage("Yuzni tahlil qilinmoqda...");
    
    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (detection) {
        setFaceDescriptor(detection.descriptor);
        setCaptureStatus("success");
        setCaptureMessage("Yuz muvaffaqiyatli saqlandi!");
        stopCamera();
      } else {
        setCaptureStatus("error");
        setCaptureMessage("Yuz topilmadi.");
      }
    } catch (err) {
      setCaptureStatus("error");
      setCaptureMessage("Tahlil vaqtida xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham ushbu xodimni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`http://localhost:3001/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEmployees();
      } else {
        alert("O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const openEditModal = (emp: any) => {
    setFullName(emp.fullName);
    setPosition(emp.position || '');
    setDepartment(emp.department || 'Umumiy');
    setSalary(emp.salary ? emp.salary.toString() : '0');
    setContactInfo(emp.contactInfo || '');
    setShiftStart(emp.shiftStart || '09:00');
    setShiftEnd(emp.shiftEnd || '18:00');
    setFaceDescriptor(emp.faceDescriptor ? JSON.parse(emp.faceDescriptor) : null);
    setCurrentEmpId(emp.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFullName("");
    setPosition("");
    setDepartment("Umumiy");
    setSalary("0");
    setContactInfo("");
    setShiftStart("09:00");
    setShiftEnd("18:00");
    setFaceDescriptor(null);
    setCurrentEmpId(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!fullName) {
      alert("Iltimos, ism-sharifni kiriting");
      return;
    }

    try {
      const url = isEditMode && currentEmpId 
        ? `http://localhost:3001/api/employees/${currentEmpId}` 
        : 'http://localhost:3001/api/employees';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          position,
          department,
          salary,
          contactInfo,
          shiftStart,
          shiftEnd,
          faceDescriptor: faceDescriptor ? JSON.stringify(Array.from(faceDescriptor)) : null
        })
      });

      if (!res.ok) throw new Error("Saqlashda xatolik");
      
      closeModal();
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFaceDescriptor(null);
    setCaptureStatus("idle");
    stopCamera();
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Xodimlar</h1>
          <p className="text-muted-foreground mt-1">Xodimlarni boshqarish va Face ID davomat tizimi</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Yangi Xodim
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Hali xodimlar qo'shilmagan.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="text-left p-4 font-medium">F.I.SH.</th>
                <th className="text-left p-4 font-medium">Lavozim</th>
                <th className="text-left p-4 font-medium">Ish jadvali</th>
                <th className="text-left p-4 font-medium">Face ID</th>
                <th className="text-left p-4 font-medium">Qo'shilgan sana</th>
                <th className="text-right p-4 font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{emp.fullName}</td>
                  <td className="p-4 text-muted-foreground">{emp.position || "—"}</td>
                  <td className="p-4 text-muted-foreground">{emp.shiftStart} - {emp.shiftEnd}</td>
                  <td className="p-4">
                    {emp.faceDescriptor ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Faol
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
                        Yo'q
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(emp.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(emp)} className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10">
                        O'zgartirish
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-md hover:bg-red-50">
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{isEditMode ? "Xodimni Tahrirlash" : "Yangi Xodim Qo'shish"}</h2>
                <p className="text-sm text-muted-foreground mt-1">Xodim ma'lumotlarini kiritib, yuzini skanerlang.</p>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">F.I.SH.</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                    placeholder="Masalan: Dilnoza Karimova"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lavozim</label>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                    placeholder="Masalan: Farmatsevt"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bo'lim</label>
                    <input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background"
                      placeholder="Masalan: Umumiy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Asosiy maosh (so'm)</label>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bog'lanish uchun (Telefon)</label>
                  <input
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background"
                    placeholder="+998 90 123 45 67"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ish boshlash (HH:mm)</label>
                    <input
                      type="time"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ish tugashi (HH:mm)</label>
                    <input
                      type="time"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Face ID Section */}
              <div className="border border-border rounded-xl p-4 bg-muted/10">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-500" />
                  Face ID (Yuz skaneri)
                </h3>
                
                {captureStatus === "success" ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Yuz muvaffaqiyatli saqlandi</span>
                    </div>
                    <button 
                      onClick={() => { setFaceDescriptor(null); setCaptureStatus("idle"); }}
                      className="text-xs bg-emerald-100 px-2 py-1 rounded hover:bg-emerald-200"
                    >
                      Qayta olish
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!stream && (
                      <button 
                        onClick={startCamera}
                        className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera className="h-5 w-5" /> Kamerani yoqish
                      </button>
                    )}
                    
                    <div className={stream ? "block" : "hidden"}>
                      <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          muted 
                          playsInline 
                          className="absolute w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className={`text-sm font-medium ${captureStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {captureMessage || "Yuzingizni kameraga aniq ko'rsating."}
                        </p>
                        <button
                          onClick={captureFace}
                          disabled={captureStatus === "capturing" || !modelsLoaded}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {captureStatus === "capturing" ? "Skanerlanmoqda..." : "Yuzni saqlash"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                disabled={!fullName || !faceDescriptor}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
