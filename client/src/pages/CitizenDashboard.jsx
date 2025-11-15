import { useState, useRef, useEffect, useContext } from "react"
import { motion } from "framer-motion"
import { MapPin, Camera, Send, Loader, Check, X, Sun, Moon } from "lucide-react"
import Map from "../components/Map" // Make sure this path is correct
import { ThemeContext } from "../contexts/ThemeContext"

// Import New Reusable Components
import Analytics from "../components/Analytics"
import ReportSection from "../components/ReportSection"

// --- HELPER FUNCTION 1 ---
const getDistanceInMeters = (loc1, loc2) => {
  // ... (function code is correct)
  if (!loc1 || !loc2) return Infinity
  const R = 6371e3 // metres
  const φ1 = (loc1.lat * Math.PI) / 180 // φ, λ in radians
  const φ2 = (loc2.lat * Math.PI) / 180
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // in metres
}

// --- HELPER FUNCTION 2 ---
const findMatchingPairs = (submissions, targetStatus) => {
  // ... (function code is correct)
  const beforeReports = submissions.filter(s => s.type === 'before' && s.status === targetStatus)
  const afterReports = submissions.filter(s => s.type === 'after' && s.status === targetStatus)
  const pairs = []
  const matchedAfterIds = new Set()

  for (const before of beforeReports) {
    let bestMatch = null
    let minDistance = Infinity

    for (const after of afterReports) {
      if (matchedAfterIds.has(after.id)) continue 
      const distance = getDistanceInMeters(before.location, after.location)
      
      if (distance < minDistance && distance <= 50) { // 50-meter threshold
        minDistance = distance
        bestMatch = after
      }
    }

    if (bestMatch) {
      pairs.push({
        id: before.id, // Use before's ID as the pair ID
        beforeReport: before,
        afterReport: bestMatch,
      })
      matchedAfterIds.add(bestMatch.id)
    }
  }
  return pairs
}


const CitizenDashboard = ({ onLogout }) => {
  // --- STATE FOR FORM 1 (REPORT WASTE) ---
  const [hasLocationBefore, setHasLocationBefore] = useState(false)
  const [locationBefore, setLocationBefore] = useState(null)
  const [imageBefore, setImageBefore] = useState(null)
  const [descriptionBefore, setDescriptionBefore] = useState("")
  const [isSubmittingBefore, setIsSubmittingBefore] = useState(false)

  // --- STATE FOR FORM 2 (AFTER CLEANUP) ---
  const [hasLocationAfter, setHasLocationAfter] = useState(false)
  const [locationAfter, setLocationAfter] = useState(null)
  const [imageAfter, setImageAfter] = useState(null)
  const [descriptionAfter, setDescriptionAfter] = useState("")
  const [isSubmittingAfter, setIsSubmittingAfter] = useState(false)
  
  // --- MAIN SUBMISSIONS STATE ---
  const [submissions, setSubmissions] = useState([
    // Mock Data Example:
    { id: 1, type: 'before', image: "https://via.placeholder.com/400x300.png?text=Before+1", description: "Waste pile at corner", location: { lat: 12.9716, lng: 77.5946 }, timestamp: new Date(Date.now() - 86400000), status: 'pending' },
    { id: 2, type: 'after', image: "https://via.placeholder.com/400x300.png?text=After+1", description: "Cleaned up corner", location: { lat: 12.9717, lng: 77.5947 }, timestamp: new Date(Date.now() - 3600000), status: 'pending' },
    { id: 3, type: 'before', image: "https://via.placeholder.com/400x300.png?text=Before+2", description: "Overflowing bin", location: { lat: 12.9736, lng: 77.5966 }, timestamp: new Date(Date.now() - 172800000), status: 'verified' },
    { id: 4, type: 'after', image: "https://via.placeholder.com/400x300.png?text=After+2", description: "Bin is now clean", location: { lat: 12.9736, lng: 77.5966 }, timestamp: new Date(Date.now() - 86400000), status: 'verified' },
    { id: 5, type: 'before', image: "https://via.placeholder.com/400x300.png?text=Before+3", description: "Litter on sidewalk", location: { lat: 12.9756, lng: 77.5986 }, timestamp: new Date(Date.now() - 1800000), status: 'pending' },
  ])
  
  // --- CAMERA STATE & REFS ---
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraType, setCameraType] = useState(null) // "before" or "after"
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const { isDark, toggleTheme } = useContext(ThemeContext)

  // --- CALCULATE STATS (NEW LOGIC) ---
  const pendingBeforeReports = submissions.filter(s => s.type === 'before' && s.status === 'pending')
  const completedPairsPending = findMatchingPairs(submissions, 'pending')
  const verifiedPairs = findMatchingPairs(submissions, 'verified')
  
  const pendingCount = pendingBeforeReports.length
  const completedCount = completedPairsPending.length
  const verifiedCount = verifiedPairs.length

  // --- EFFECT FOR CAMERA STREAM ---
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch((err) => console.error("[v0] Play error:", err))
      }
    }
  }, [stream]) // This effect runs when the 'stream' state changes

  // --- LOCATION & CAMERA LOGIC ---
  const requestLocation = (type) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          if (type === 'before') {
            setLocationBefore(newLoc)
            setHasLocationBefore(true)
          } else {
            setLocationAfter(newLoc)
            setHasLocationAfter(true)
          }
        },
        () => alert("Failed to get location. Please enable location services."),
      )
    }
  }

  const startCamera = (type) => {
    setCameraType(type)
    setCameraOpen(true)
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Your browser does not support camera access.")
      setCameraOpen(false)
      return
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream
        setStream(stream)
      })
      .catch((err) => {
        console.error("[v0] Camera error:", err)
        alert(`Camera access denied: ${err.message}. Please check browser permissions.`)
        setCameraOpen(false)
      })
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (video.videoWidth === 0 || video.videoHeight === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const imageData = canvas.toDataURL("image/jpeg")

    if (cameraType === "before") {
      setImageBefore(imageData)
    } else if (cameraType === "after") {
      setImageAfter(imageData)
    }
    stopCamera()
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setCameraOpen(false)
    setCameraType(null)
  }

  // --- SUBMIT LOGIC FOR FORM 1 ---
  const handleSubmitBefore = () => {
    if (!imageBefore || !descriptionBefore || !hasLocationBefore) {
      alert("Please provide image, description, and location access")
      return
    }
    setIsSubmittingBefore(true)
    setTimeout(() => {
      const newSubmission = {
        id: Date.now(),
        type: 'before',
        image: imageBefore,
        description: descriptionBefore,
        location: locationBefore,
        timestamp: new Date(),
        status: "pending",
      }
      setSubmissions([newSubmission, ...submissions]) // Add to main state
      setImageBefore(null)
      setDescriptionBefore("")
      setIsSubmittingBefore(false)
      alert("Waste report submitted successfully!")
    }, 1000)
  }
  
  // --- SUBMIT LOGIC FOR FORM 2 ---
  const handleSubmitAfter = () => {
    if (!imageAfter || !hasLocationAfter) {
      alert("Please provide image, description, and location access")
      return
    }
    setIsSubmittingAfter(true)
    setTimeout(() => {
      const newSubmission = {
        id: Date.now(),
        type: 'after',
        image: imageAfter,
        description: descriptionAfter,
        location: locationAfter,
        timestamp: new Date(),
        status: "pending",
      }
      setSubmissions([newSubmission, ...submissions]) // Add to main state
      setImageAfter(null)
      setDescriptionAfter("")
      setIsSubmittingAfter(false)
      alert("Cleanup photo submitted successfully!")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="bg-surface border-b border-muted sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Prakriti - Citizen Portal</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 hover:bg-muted rounded-lg transition-all">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-accent-red text-white rounded-lg hover:bg-accent-red-dark transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* --- ROW 1: ANALYTICS --- */}
        <Analytics 
          pendingCount={pendingCount}
          completedCount={completedCount}
          verifiedCount={verifiedCount}
        />

        {/* --- ROW 2: FORMS (INDEPENDENT) --- */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          
          {/* SECTION 1: REPORT WASTE (FORM 1) */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-surface rounded-2xl p-8 border border-muted sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Report Waste</h2>
              {hasLocationBefore ? (
                <motion.div className="p-4 bg-accent-green/10 border border-accent-green rounded-lg flex items-center gap-3 mb-6">
                  <Check className="w-5 h-5 text-accent-green" />
                  <p className="font-semibold">Location Allowed</p>
                </motion.div>
              ) : (
                <button
                  onClick={() => requestLocation('before')}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" /> Allow Location Access
                </button>
              )}
              {cameraOpen && cameraType === "before" ? (
                <div className="mb-6">
                  <div className="relative rounded-lg overflow-hidden border-2 border-accent-green bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                    <div className="absolute bottom-4 left-0 right-0 flex gap-3 justify-center px-4">
                      <button onClick={capturePhoto} className="px-8 py-3 bg-accent-green text-white rounded-lg font-bold flex items-center gap-2">
                        <Camera className="w-6 h-6" /> Capture
                      </button>
                      <button onClick={stopCamera} className="px-8 py-3 bg-accent-red text-white rounded-lg font-bold">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startCamera("before")}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" /> Take "Before" Photo
                </button>
              )}
              {imageBefore && !cameraOpen && (
                <motion.div className="mb-6 relative rounded-lg overflow-hidden border border-muted">
                  <img src={imageBefore} alt="Captured Before" className="w-full h-48 object-cover" />
                  <button onClick={() => setImageBefore(null)} className="absolute top-2 right-2 p-2 bg-accent-red rounded-lg">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={descriptionBefore}
                  onChange={(e) => setDescriptionBefore(e.target.value)}
                  placeholder="Describe the waste situation..."
                  className="w-full h-24 px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:border-accent-green"
                />
              </div>
              <motion.button
                onClick={handleSubmitBefore}
                disabled={isSubmittingBefore}
                className="w-full py-3 px-4 bg-accent-green hover:bg-accent-green-dark disabled:bg-muted text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isSubmittingBefore ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmittingBefore ? "Submitting..." : "Submit Report"}
              </motion.button>
            </div>
          </motion.div>

          {/* SECTION 2: AFTER CLEANUP PHOTO (FORM 2) */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-surface rounded-2xl p-8 border border-muted sticky top-24">
              <h2 className="text-2xl font-bold mb-6">After Cleanup Photo</h2>
              {hasLocationAfter ? (
                <motion.div className="p-4 bg-accent-green/10 border border-accent-green rounded-lg flex items-center gap-3 mb-6">
                  <Check className="w-5 h-5 text-accent-green" />
                  <p className="font-semibold">Location Allowed</p>
                </motion.div>
              ) : (
                <button
                  onClick={() => requestLocation('after')}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" /> Allow Location Access
                </button>
              )}
              {cameraOpen && cameraType === "after" ? (
                <div className="mb-6">
                  <div className="relative rounded-lg overflow-hidden border-2 border-accent-green bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                    <div className="absolute bottom-4 left-0 right-0 flex gap-3 justify-center px-4">
                      <button onClick={capturePhoto} className="px-8 py-3 bg-accent-green text-white rounded-lg font-bold flex items-center gap-2">
                        <Camera className="w-6 h-6" /> Capture
                      </button>
                      <button onClick={stopCamera} className="px-8 py-3 bg-accent-red text-white rounded-lg font-bold">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startCamera("after")}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" /> Take "After" Photo
                </button>
              )}
              {imageAfter && !cameraOpen && (
                <motion.div className="mb-6 relative rounded-lg overflow-hidden border border-muted">
                  <img src={imageAfter} alt="Captured After" className="w-full h-48 object-cover" />
                  <button onClick={() => setImageAfter(null)} className="absolute top-2 right-2 p-2 bg-accent-red rounded-lg">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
                <textarea
                  value={descriptionAfter}
                  onChange={(e) => setDescriptionAfter(e.target.value)}
                  placeholder="Describe the cleanup (e.g., 'All clean now')..."
                  className="w-full h-24 px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:border-accent-green"
                />
              </div>
              <motion.button
                onClick={handleSubmitAfter}
                disabled={isSubmittingAfter}
                className="w-full py-3 px-4 bg-accent-blue hover:bg-accent-blue-dark disabled:bg-muted text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isSubmittingAfter ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isSubmittingAfter ? "Submitting..." : "Submit Cleanup Photo"}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* --- ROW 3: MAP --- */}
        <motion.div className="mb-12 relative z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-surface rounded-2xl p-8 border border-muted">
            <h2 className="text-2xl font-bold mb-4">Waste Hotspots Map</h2>
            {/* --- THIS LINE IS FIXED --- */}
            <p className="text-muted-foreground mb-4">
              Showing all 'Pending' status reports. Verified reports are removed.
            </p>
            <div className="h-[600px] rounded-lg overflow-hidden border border-muted">
              <Map 
                submissions={submissions.filter(s => s.status === 'pending')} 
                location={locationBefore || locationAfter} // Pass last known location
              />
            </div>
          </div>
        </motion.div>

        {/* --- ROW 4: REPORT SECTIONS --- */}
        
        <ReportSection
          title="Pending Reports"
          subtitle='Waste reports awaiting an "After" cleanup photo.'
          reports={pendingBeforeReports}
          cardType="single"
        />
        
        <ReportSection
          title="Completed (Awaiting Verification)"
          subtitle='Paired "Before" and "After" photos that are waiting for an official to verify.'
          reports={completedPairsPending}
          cardType="paired"
          statusText="Awaiting Verification"
          statusColor="blue"
        />

        <ReportSection
          title="Verified by Officials"
          subtitle='Great work! These are your cleanup reports that have been officially verified.'
          reports={verifiedPairs}
          cardType="paired"
        
          statusText="Verified"
          statusColor="green"
        />

      </div>
      
      {/* This single canvas is used by both forms, depending on which one opens the camera */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default CitizenDashboard