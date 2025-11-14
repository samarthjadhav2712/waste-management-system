import { useState, useRef , useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Camera, Send, Loader, Check, X, Sun, Moon } from "lucide-react"
import Map from "../components/Map" // Make sure this path is correct
import { useContext } from "react"
import { ThemeContext } from "../contexts/ThemeContext" // Make sure this path is correct

const CitizenDashboard = ({ onLogout }) => {
  const [hasLocation, setHasLocation] = useState(false)
  const [location, setLocation] = useState(null)
  const [image, setImage] = useState(null)
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraType, setCameraType] = useState(null) // "report" or "after"
  const [hasLocationAfter, setHasLocationAfter] = useState(false)
  const [afterPhotos, setAfterPhotos] = useState({})
  const [selectedReportId, setSelectedReportId] = useState(null)

  const [stream, setStream] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const { isDark, toggleTheme } = useContext(ThemeContext)

  useEffect(() => {
    // This effect runs when the 'stream' state changes
    if (videoRef.current && stream) {
      console.log("[v0] Attaching stream to video element")
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        console.log("[v0] Video metadata loaded, starting playback")
        videoRef.current
          .play()
          .then(() => console.log("[v0] Video playback started"))
          .catch((err) => console.error("[v0] Play error:", err))
      }
    }
  }, [stream]) // The dependency array: this code re-runs when 'stream' changes

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setHasLocation(true)
        },
        () => alert("Failed to get location. Please enable location services."),
      )
    }
  }

  const requestLocationAfter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setHasLocationAfter(true),
        () => alert("Failed to get location. Please enable location services."),
      )
    }
  }

  const startCamera = (type) => {
    setCameraType(type)
    setCameraOpen(true) // <-- Set this immediately to render the <video> element
    console.log("[v0] Starting camera for type:", type)

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Your browser does not support camera access.")
      setCameraOpen(false) // <-- Close UI if it fails
      return
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        console.log("[v0] Stream received:", stream)
        streamRef.current = stream
        setStream(stream) // <-- Save the stream to state (this triggers the useEffect)
      })
      .catch((err) => {
        console.error("[v0] Camera error:", err)
        alert(`Camera access denied: ${err.message}. Please check browser permissions.`)
        setCameraOpen(false) // <-- Close UI on error
      })
  }

  const capturePhoto = () => {
    console.log("[v0] Capturing photo, videoRef:", videoRef.current, "canvasRef:", canvasRef.current)

    if (!videoRef.current || !canvasRef.current) {
      console.error("[v0] Missing refs")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    console.log("[v0] Video dimensions:", video.videoWidth, "x", video.videoHeight)

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert("Video not ready yet. Please wait a moment.")
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const imageData = canvas.toDataURL("image/jpeg")

    console.log("[v0] Photo captured, type:", cameraType)

    if (cameraType === "report") {
      setImage(imageData)
    } else if (cameraType === "after" && selectedReportId) {
      setAfterPhotos({
        ...afterPhotos,
        [selectedReportId]: imageData,
      })
      setSelectedReportId(null)
    }

    stopCamera()
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null) // <-- ADD THIS to clear the stream state
    setCameraOpen(false)
    setCameraType(null)
  }

  const handleSubmit = () => {
    if (!image || !description || !hasLocation) {
      alert("Please provide image, description, and location access")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      const newSubmission = {
        id: Date.now(),
        image,
        description,
        location,
        timestamp: new Date(),
        status: "pending",
      }
      setSubmissions([newSubmission, ...submissions])
      setImage(null)
      setDescription("")
      setIsSubmitting(false)
      alert("Report submitted successfully!")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="bg-surface border-b border-muted sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
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
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* SECTION 1: REPORT WASTE */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-surface rounded-2xl p-8 border border-muted sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Report Waste</h2>

              {hasLocation ? (
                <motion.div
                  className="p-4 bg-accent-green/10 border border-accent-green rounded-lg flex items-center gap-3 mb-6"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <Check className="w-5 h-5 text-accent-green" />
                  <div className="text-sm">
                    <p className="font-semibold">Location Allowed</p>
                    <p className="text-muted-foreground">
                      {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={requestLocation}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted text-foreground rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Allow Location Access
                </button>
              )}

              {cameraOpen && cameraType === "report" ? (
                
                <div className="mb-6">
                    <div>
                        {(() => {
                        console.log("inside return:", submissions)
                        return null
                        })()}
                    </div>

                  <div className="relative rounded-lg overflow-hidden border-2 border-accent-green bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                    <div className="absolute bottom-4 left-0 right-0 flex gap-3 justify-center px-4">
                      <motion.button
                        onClick={capturePhoto}
                        className="px-8 py-3 bg-accent-green hover:bg-accent-green-dark text-white rounded-lg font-bold flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Camera className="w-6 h-6" />
                        Capture
                      </motion.button>
                      <motion.button
                        onClick={stopCamera}
                        className="px-8 py-3 bg-accent-red hover:bg-accent-red-dark text-white rounded-lg font-bold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-6 h-6" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startCamera("report")}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted text-foreground rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
              )}

              {image && !cameraOpen && (
                <motion.div
                  className="mb-6 relative rounded-lg overflow-hidden border border-muted"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <img src={image || "/placeholder.svg"} alt="Captured" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-2 bg-accent-red rounded-lg hover:bg-accent-red-dark"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the waste situation..."
                  className="w-full h-24 px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green resize-none"
                />
              </div>

              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-accent-green hover:bg-accent-green-dark disabled:bg-muted text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Report
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* SECTION 2: AFTER CLEANUP PHOTO */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-surface rounded-2xl p-8 border border-muted sticky top-24">
              <h2 className="text-2xl font-bold mb-6">After Cleanup Photo</h2>
              <p className="text-muted-foreground mb-6">
                Submit photos of completed cleanup. Location access required.
              </p>

              {hasLocationAfter ? (
                <motion.div
                  className="p-4 bg-accent-green/10 border border-accent-green rounded-lg flex items-center gap-3 mb-6"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <Check className="w-5 h-5 text-accent-green" />
                  <p className="font-semibold">Location Access Granted</p>
                </motion.div>
              ) : (
                <button
                  onClick={requestLocationAfter}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted text-foreground rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Allow Location Access
                </button>
              )}

              {cameraOpen && cameraType === "after" ? (
                <div className="mb-6">
                  <div className="relative rounded-lg overflow-hidden border-2 border-accent-green bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                    <div className="absolute bottom-4 left-0 right-0 flex gap-3 justify-center px-4">
                      <motion.button
                        onClick={capturePhoto}
                        className="px-8 py-3 bg-accent-green hover:bg-accent-green-dark text-white rounded-lg font-bold flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Camera className="w-6 h-6" />
                        Capture
                      </motion.button>
                      <motion.button
                        onClick={stopCamera}
                        className="px-8 py-3 bg-accent-red hover:bg-accent-red-dark text-white rounded-lg font-bold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-6 h-6" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!hasLocationAfter) requestLocationAfter()
                    else startCamera("after")
                  }}
                  disabled={!hasLocationAfter}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted disabled:opacity-50 text-foreground rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
              )}

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Your pending reports:</p>
                {submissions
                  .filter((submission) => !afterPhotos[submission.id]) // Only show pending
                  .map((submission) => (
                  <motion.div
                    key={submission.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-muted hover:border-accent-green"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{submission.description}</p>
                      <p className="text-sm text-muted-foreground">{submission.timestamp.toLocaleString()}</p>
                      {afterPhotos[submission.id] && (
                        <p className="text-sm text-accent-green font-semibold">✓ After photo uploaded</p>
                      )}
                    </div>
                    {!afterPhotos[submission.id] && (
                      <motion.button
                        onClick={() => {
                          setSelectedReportId(submission.id)
                          if (!hasLocationAfter) requestLocationAfter()
                          else startCamera("after")
                        }}
                        className="px-4 py-2 bg-accent-green text-white rounded-lg font-semibold hover:bg-accent-green-dark flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Camera className="w-4 h-4" />
                        Add
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- START: MODIFIED SECTION --- */}

        {/* Map Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-surface rounded-2xl p-8 border border-muted">
            <h2 className="text-2xl font-bold mb-4">Waste Hotspots Map</h2>
            <div className="h-96 rounded-lg overflow-hidden border border-muted">
              <Map submissions={submissions} location={location} />
            </div>
          </div>
        </motion.div>

        {/* Your Pending Reports */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-6">Your Pending Reports</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions
              .filter((submission) => !afterPhotos[submission.id]) // <-- Shows only pending
              .map((submission) => (
                <motion.div
                  key={submission.id}
                  className="bg-surface rounded-xl overflow-hidden border border-muted hover:border-accent-green"
                  whileHover={{ scale: 1.02, translateY: -5 }}
                >
                  <img
                    src={submission.image || "/placeholder.svg"}
                    alt="Submission"
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {submission.timestamp.toLocaleString()}
                    </p>
                    <p className="text-foreground line-clamp-2 mb-3">{submission.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-yellow"></div>
                      <span className="text-sm font-semibold capitalize">{submission.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>

        {/* Your Completed Reports */}
        <motion.div
          className="mt-12" // Add some margin-top
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-6">Your Completed Reports</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions
              .filter((submission) => afterPhotos[submission.id]) // <-- Shows only completed
              .map((submission) => (
                <motion.div
                  key={submission.id}
                  className="bg-surface rounded-xl overflow-hidden border border-muted"
                  whileHover={{ scale: 1.02, translateY: -5 }}
                >
                  {/* Shows BEFORE & AFTER IMAGES */}
                  <div className="flex w-full h-40">
                    <div className="w-1/2 relative">
                      <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        BEFORE
                      </span>
                      <img
                        src={submission.image}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-1/2 relative">
                      <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        AFTER
                      </span>
                      <img
                        src={afterPhotos[submission.id]}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {submission.timestamp.toLocaleString()}
                    </p>
                    <p className="text-foreground line-clamp-2 mb-3">{submission.description}</p>
                    {/* STATUS IS NOW GREEN/COMPLETED */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                      <span className="text-sm font-semibold capitalize">Completed</span>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>

        {/* --- END: MODIFIED SECTION --- */}

      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default CitizenDashboard