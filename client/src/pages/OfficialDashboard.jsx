import { useState, useRef, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Users, Sun, Moon, X, Eye } from "lucide-react"
import { ThemeContext } from "../contexts/ThemeContext"
import Map from "../components/Map"

// Import New Reusable Components
import Analytics from "../components/Analytics"
import ReportSection from "../components/ReportSection"
import ReportCardPaired from "../components/ReportCardPaired"

// --- HELPER FUNCTION 1 ---
const getDistanceInMeters = (loc1, loc2) => {
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


const OfficialDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("pending")
  
  // --- UPDATED STATE to match CitizenDashboard structure ---
  const [submissions, setSubmissions] = useState([
    // Pair 1: Pending Verification (Completed)
    { id: 1, type: 'before', image: "https://via.placeholder.com/400x300.png?text=Before+1", description: "Waste pile at corner", location: { lat: 12.9716, lng: 77.5946 }, timestamp: new Date(Date.now() - 86400000), status: 'pending', contributor: "John D." },
    { id: 2, type: 'after', image: "https://via.placeholder.com/400x300.png?text=After+1", description: "Cleaned up corner", location: { lat: 12.9717, lng: 77.5947 }, timestamp: new Date(Date.now() - 3600000), status: 'pending', contributor: "John D." },
    
    // Pair 2: Verified
    { id: 3, type: 'before', image: "https://via.placeholder.com/400x300.png?text=Before+2", description: "Overflowing bin", location: { lat: 12.9736, lng: 77.5966 }, timestamp: new Date(Date.now() - 172800000), status: 'verified', contributor: "Sarah M." },
    { id: 4, type: 'after', image: "https://via.placeholder.com/400x300.png?text=After+2", description: "Bin is now clean", location: { lat: 12.9736, lng: 77.5966 }, timestamp: new Date(Date.now() - 86400000), status: 'verified', contributor: "Sarah M." },
    
    // Item 3: Pending (Before only)
    { id: 5, type: 'before', image: "https://via.placeholder.com/400x300.png?text=Before+3", description: "Litter on sidewalk", location: { lat: 12.9756, lng: 77.5986 }, timestamp: new Date(Date.now() - 1800000), status: 'pending', contributor: "Mike L." },
  ])
  
  const [selectedPair, setSelectedPair] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const { isDark, toggleTheme } = useContext(ThemeContext)

  // --- CALCULATE STATS ---
  const pendingBeforeReports = submissions.filter(s => s.type === 'before' && s.status === 'pending')
  const completedPairsPending = findMatchingPairs(submissions, 'pending')
  const verifiedPairs = findMatchingPairs(submissions, 'verified')
  
  const pendingCount = pendingBeforeReports.length
  const completedCount = completedPairsPending.length
  const verifiedCount = verifiedPairs.length

  // --- UPDATED VERIFICATION LOGIC ---
  const handleApprove = (pair) => {
    setSubmissions(prevSubmissions =>
      prevSubmissions.map(sub => {
        if (sub.id === pair.beforeReport.id || sub.id === pair.afterReport.id) {
          return { ...sub, status: 'verified' }
        }
        return sub
      })
    )
    setShowComparison(false)
    setSelectedPair(null)
  }

  const handleReject = (pair) => {
    // Removes both reports from the system
    setSubmissions(prevSubmissions =>
      prevSubmissions.filter(
        sub => sub.id !== pair.beforeReport.id && sub.id !== pair.afterReport.id
      )
    )
    setShowComparison(false)
    setSelectedPair(null)
  }

  const handleOpenComparison = (pair) => {
    setSelectedPair(pair)
    setShowComparison(true)
    setSliderPosition(50)
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
          <div>
            <h1 className="text-2xl font-bold">Prakriti - Official Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Verify waste cleanup reports</p>
          </div>
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
        
        {/* --- ROW 1: ANALYTICS (REFACTORED) --- */}
        <Analytics
          pendingCount={pendingCount}
          completedCount={completedCount}
          verifiedCount={verifiedCount}
        />

        {/* --- NEW LAYOUT: Grid removed, components are stacked --- */}

        {/* Map Section (Full Width) */}
        <motion.div
          className="mt-12 mb-8 relative z-10" // z-10 fix
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-surface rounded-2xl p-8 border border-muted">
            {/* Cleaned up title/stats section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-2xl font-bold mb-2 sm:mb-0">Pending Hotspots Map</h2>
              <div className="text-sm sm:text-right">
                <p className="font-semibold">
                  Total Pending Reports: {pendingCount + completedCount}
                </p>
                <p className="text-xs text-muted-foreground">Showing all 'pending' and 'awaiting verification' reports.</p>
              </div>
            </div>
            {/* Increased map height */}
            <div className="h-[600px] rounded-lg overflow-hidden border border-muted">
              <Map 
                submissions={submissions.filter((r) => r.status === "pending")} 
                location={null} 
              />
            </div>
          </div>
        </motion.div>

        {/* Reports Section (Full Width) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-surface rounded-2xl border border-muted overflow-hidden">
            {/* --- TABS --- */}
            <div className="p-8 border-b border-muted">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === "pending"
                      ? "bg-accent-green text-background"
                      : "bg-muted text-foreground hover:bg-muted-dark"
                  }`}
                >
                  Verification Queue
                </button>
                <button
                  onClick={() => setActiveTab("verified")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === "verified"
                      ? "bg-accent-green text-background"
                      : "bg-muted text-foreground hover:bg-muted-dark"
                  }`}
                >
                  All Verified Reports
                </button>
              </div>
            </div>

            {/* --- TAB CONTENT (FIXED: removed max-h and overflow) --- */}
            <div>
              <AnimatePresence mode="wait">
                {/* --- PENDING TAB --- */}
                {activeTab === "pending" && (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8"
                  >
                    {/* --- Awaiting Verification Section --- */}
                    <h2 className="text-2xl font-bold mb-6">Awaiting Verification</h2>
                    <p className="text-muted-foreground mb-4 -mt-4">
                      These reports have 'before' and 'after' photos. Click to verify.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedPairsPending.map(pair => (
                        <div 
                          key={pair.id} 
                          className="cursor-pointer" 
                          onClick={() => handleOpenComparison(pair)}
                        >
                          <ReportCardPaired 
                            pair={pair} 
                            statusText="Click to Verify" 
                            statusColor="blue"
                          />
                        </div>
                      ))}
                      {completedCount === 0 && (
                        <p className="p-4 text-muted-foreground md:col-span-3">No reports are awaiting verification.</p>
                      )}
                    </div>

                    <div className="my-8 border-t border-muted"></div>

                    {/* --- Pending Reports Section --- */}
                    <ReportSection
                      title="Pending Reports"
                      subtitle="These reports are awaiting an 'after' photo from a citizen."
                      reports={pendingBeforeReports}
                      cardType="single"
                    />
                  </motion.div>
                )}

                {/* --- VERIFIED TAB --- */}
                {activeTab === "verified" && (
                  <motion.div
                    key="verified"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8"
                  >
                    <ReportSection
                      title="Verified Cleanups"
                      subtitle="All reports that have been successfully verified."
                      reports={verifiedPairs}
                      cardType="paired"
                      statusText="Verified"
                      statusColor="green"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        
        {/* --- End of new layout --- */}
      </div>

      {/* --- MODAL (No changes needed, but using selectedPair) --- */}
      <AnimatePresence>
        {showComparison && selectedPair && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-surface rounded-2xl border border-muted max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-surface p-8 border-b border-muted flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold">Verify Cleanup Report</h2>
                  <p className="text-muted-foreground text-sm mt-1">{selectedPair.beforeReport.description}</p>
                </div>
                <button
                  onClick={() => setShowComparison(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4">Before & After Cleanup Comparison</h3>
                  <div className="relative bg-background rounded-xl overflow-hidden border border-muted">
                    <div className="relative w-full aspect-video">
                      {/* Before Image */}
                      <img
                        src={selectedPair.beforeReport.image || "/placeholder.svg"}
                        alt="Before cleanup"
                        className="w-full h-full object-cover"
                      />
                      {/* After Image Overlay with Slider */}
                      <div
                        className="absolute top-0 left-0 w-full h-full overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={selectedPair.afterReport.image || "/placeholder.svg"}
                          alt="After cleanup"
                          className="w-full h-full object-cover"
                          style={{ width: `${(100 / sliderPosition) * 100}%` }}
                        />
                      </div>
                      {/* Slider Handle */}
                      <motion.input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-col-resize z-10"
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-accent-green cursor-col-resize pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-green text-white p-2 rounded-full whitespace-nowrap text-xs font-semibold">
                          Drag
                        </div>
                      </div>
                      {/* Labels */}
                      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white rounded-lg text-sm font-semibold">
                        Before
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white rounded-lg text-sm font-semibold">
                        After
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-background rounded-lg p-4 border border-muted">
                    <p className="text-sm text-muted-foreground mb-1">Contributor</p>
                    <p className="text-lg font-semibold">{selectedPair.beforeReport.contributor}</p>
                  </div>
                   <div className="bg-background rounded-lg p-4 border border-muted">
                    <p className="text-sm text-muted-foreground mb-1">Reported</p>
                    <p className="text-lg font-semibold">{new Date(selectedPair.beforeReport.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => handleApprove(selectedPair)}
                    className="flex-1 py-3 px-4 bg-accent-green text-white rounded-lg font-semibold hover:bg-accent-green-dark transition-all"
                  >
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    Approve & Mark Verified
                  </motion.button>
                  <motion.button
                    onClick={() => handleReject(selectedPair)}
                    className="flex-1 py-3 px-4 bg-accent-red text-white rounded-lg font-semibold hover:bg-accent-red-dark transition-all"
                  >
                    Reject Report
                  </motion.button>
                  <button
                    onClick={() => setShowComparison(false)}
                    className="px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OfficialDashboard