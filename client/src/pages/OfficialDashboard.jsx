import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Users, Sun, Moon, X, Eye } from "lucide-react"
import { useContext } from "react"
import Map from "../components/Map"
import { ThemeContext } from "../contexts/ThemeContext"

const OfficialDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("pending")
  const [reports, setReports] = useState([
    {
      id: 1,
      description: "Heavy plastic waste near park",
      status: "pending",
      contributor: "John D.",
      submissions: 3,
      location: { lat: 28.6139, lng: 77.209 },
      beforeImage: "/waste-site-before.jpg",
      afterImage: "/bottles-cleaned.jpg",
    },
    {
      id: 2,
      description: "Glass bottles on street",
      status: "pending",
      contributor: "Sarah M.",
      submissions: 5,
      location: { lat: 28.6215, lng: 77.215 },
      beforeImage: "/bottles-before.jpg",
      afterImage: null,
    },
  ])
  const [selectedReport, setSelectedReport] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const { isDark, toggleTheme } = useContext(ThemeContext)

  const stats = [
    { label: "Pending Reports", value: "12", icon: AlertCircle, color: "accent-yellow" },
    { label: "Verified Cleanups", value: "48", icon: CheckCircle, color: "accent-green" },
    { label: "Active Citizens", value: "156", icon: Users, color: "accent-blue" },
  ]

  const handleApprove = (id) => {
    setReports(reports.filter((r) => r.id !== id))
    setSelectedReport(null)
    setShowComparison(false)
  }

  const handleReject = (id) => {
    setReports(reports.filter((r) => r.id !== id))
    setSelectedReport(null)
    setShowComparison(false)
  }

  const handleOpenComparison = (report) => {
    setSelectedReport(report)
    setShowComparison(true)
    setSliderPosition(50)
  }

  const handleAfterImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReports(reports.map((r) => (r.id === selectedReport.id ? { ...r, afterImage: reader.result } : r)))
        setSelectedReport({ ...selectedReport, afterImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
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
          <div>
            <h1 className="text-2xl font-bold">Prakriti - Official Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Verify waste cleanup with before & after photos</p>
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
        {/* Stats */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <motion.div
                key={index}
                className="bg-surface rounded-2xl p-8 border border-muted"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground">{stat.label}</h3>
                  <IconComponent className={`w-6 h-6 text-${stat.color}`} />
                </div>
                <p className={`text-4xl font-bold text-${stat.color}`}>{stat.value}</p>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-surface rounded-2xl p-8 border border-muted sticky top-24">
              <h2 className="text-xl font-bold mb-4">Pending Reports Map</h2>
              <div className="h-96 rounded-lg overflow-hidden border border-muted">
                <Map submissions={reports.filter((r) => r.status === "pending")} location={null} />
              </div>
              <div className="mt-6 space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Total Pending: {reports.filter((r) => r.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Click a report to verify with before/after photos</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Reports Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-surface rounded-2xl border border-muted overflow-hidden">
              <div className="p-8 border-b border-muted">
                <h2 className="text-2xl font-bold mb-6">Verification Queue</h2>

                <div className="flex gap-4 mb-6">
                  <div className="px-6 py-2 rounded-lg font-semibold bg-accent-green text-background">
                    Pending Reports
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <div className="divide-y divide-muted max-h-[600px] overflow-y-auto">
                {reports.filter((r) => r.status === "pending").length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No pending reports to verify</div>
                ) : (
                  reports
                    .filter((r) => r.status === "pending")
                    .map((report) => (
                      <motion.div
                        key={report.id}
                        className="p-8 hover:bg-background/50 transition-all"
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-lg font-semibold mb-2">{report.description}</p>
                            <p className="text-sm text-muted-foreground mb-1">Reported by: {report.contributor}</p>
                            <p className="text-sm text-muted-foreground mb-3">
                              Before Photo Available •{" "}
                              {report.afterImage ? "After Photo Available" : "Awaiting after photo"}
                            </p>
                          </div>
                          <span
                            className={`px-4 py-2 rounded-lg font-semibold capitalize text-sm whitespace-nowrap ${
                              report.afterImage
                                ? "bg-accent-green/20 text-accent-green"
                                : "bg-accent-yellow/20 text-accent-yellow"
                            }`}
                          >
                            {report.afterImage ? "Ready to Verify" : "Waiting for After Photo"}
                          </span>
                        </div>

                        <motion.button
                          onClick={() => handleOpenComparison(report)}
                          className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                            report.afterImage
                              ? "bg-accent-green text-white hover:bg-accent-green-dark"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          }`}
                          whileHover={report.afterImage ? { scale: 1.02 } : {}}
                          whileTap={report.afterImage ? { scale: 0.98 } : {}}
                          disabled={!report.afterImage}
                        >
                          <Eye className="w-4 h-4" />
                          {report.afterImage ? "View & Approve" : "Waiting for Citizen"}
                        </motion.button>
                      </motion.div>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showComparison && selectedReport && (
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
              <div className="sticky top-0 bg-surface p-8 border-b border-muted flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Verify Cleanup Report</h2>
                  <p className="text-muted-foreground text-sm mt-1">{selectedReport.description}</p>
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
                        src={selectedReport.beforeImage || "/placeholder.svg"}
                        alt="Before cleanup"
                        className="w-full h-full object-cover"
                      />

                      {/* After Image Overlay with Slider */}
                      {selectedReport.afterImage && (
                        <div
                          className="absolute top-0 left-0 w-full h-full overflow-hidden"
                          style={{ width: `${sliderPosition}%` }}
                        >
                          <img
                            src={selectedReport.afterImage || "/placeholder.svg"}
                            alt="After cleanup"
                            className="w-full h-full object-cover"
                            style={{ width: `${(100 / sliderPosition) * 100}%` }}
                          />
                        </div>
                      )}

                      {/* Slider Handle */}
                      {selectedReport.afterImage && (
                        <motion.input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderPosition}
                          onChange={(e) => setSliderPosition(Number(e.target.value))}
                          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-col-resize z-10"
                        />
                      )}

                      {selectedReport.afterImage && (
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-accent-green cursor-col-resize"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-green text-white p-2 rounded-full whitespace-nowrap text-xs font-semibold">
                            Drag to compare
                          </div>
                        </div>
                      )}

                      {/* Labels */}
                      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white rounded-lg text-sm font-semibold">
                        Before
                      </div>
                      {selectedReport.afterImage && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white rounded-lg text-sm font-semibold">
                          After
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-background rounded-lg p-4 border border-muted">
                    <p className="text-sm text-muted-foreground mb-1">Contributor</p>
                    <p className="text-lg font-semibold">{selectedReport.contributor}</p>
                  </div>
                  <div className="bg-background rounded-lg p-4 border border-muted">
                    <p className="text-sm text-muted-foreground mb-1">Total Reports</p>
                    <p className="text-lg font-semibold">{selectedReport.submissions}</p>
                  </div>
                  <div className="bg-background rounded-lg p-4 border border-muted md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-foreground">{selectedReport.description}</p>
                  </div>
                </div>

                {/* Approval Section */}
                <div className="bg-accent-green/10 border border-accent-green rounded-lg p-6 mb-8">
                  <h4 className="font-bold mb-3 text-accent-green">Verification Status</h4>
                  <p className="text-sm mb-4">
                    {selectedReport.afterImage
                      ? "Both before and after photos are available. Review the comparison above and approve if the cleanup work is satisfactory."
                      : "Waiting for the citizen to submit an after-cleanup photo."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => handleApprove(selectedReport.id)}
                    className="flex-1 py-3 px-4 bg-accent-green text-white rounded-lg font-semibold hover:bg-accent-green-dark transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    Approve & Mark Complete
                  </motion.button>
                  <motion.button
                    onClick={() => handleReject(selectedReport.id)}
                    className="flex-1 py-3 px-4 bg-accent-red text-white rounded-lg font-semibold hover:bg-accent-red-dark transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reject Report
                  </motion.button>
                  <button
                    onClick={() => setShowComparison(false)}
                    className="px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted transition-all"
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
