import { motion } from "framer-motion"
import { MapPin, Camera, BarChart3, Leaf, Users, Check } from "lucide-react"
import { Link } from "react-router-dom"
import Header from "../components/Header"
import Footer from "../components/Footer"

const LandingPage = () => {
  const features = [
    {
      icon: Camera,
      title: "Smart Capture",
      description: "Report waste directly from your camera with automatic location tagging",
    },
    {
      icon: MapPin,
      title: "Live Hotspots",
      description: "View litter-prone zones on interactive city maps in real-time",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track cleanup trends, efficiency metrics, and community impact",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Collaborate with citizens and officials for cleaner cities",
    },
    {
      icon: Leaf,
      title: "Eco Impact",
      description: "Monitor environmental improvements and celebrate achievements",
    },
    {
      icon: Check,
      title: "Verification System",
      description: "Official approval and before-after documentation",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  return (
    <div className="bg-linear-to-b from-background via-background to-surface text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 md:px-8">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-6">
              <Leaf className="w-16 h-16 text-accent-green animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-pretty leading-tight mb-6">Prakriti</h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8">
              Smart Waste Monitoring for Cleaner Cities
            </p>
          </motion.div>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Empower citizens to report waste hotspots, help officials track cleanup efforts, and build a cleaner
            community together through crowdsourced data and real-time collaboration.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link
              to="/auth"
              className="px-8 py-4 bg-accent-green text-background rounded-lg font-semibold hover:bg-accent-green-dark transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-10 md:py-22 px-4 md:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need to make an impact</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <motion.div
                  key={index}
                  className="p-8 bg-background rounded-xl border border-muted hover:border-accent-green transition-all hover:shadow-lg hover:shadow-accent-green/20"
                  variants={itemVariants}
                >
                  <motion.div
                    className="mb-4 inline-block p-3 bg-accent-green/10 rounded-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <IconComponent className="w-8 h-8 text-accent-green" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 md:py-32 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Impact</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: "50K+", label: "Reports Filed" },
              { value: "15K+", label: "Cleanups Completed" },
              { value: "200+", label: "Active Citizens" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-4 rounded-xl bg-surface border border-muted"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-4xl md:text-5xl font-bold text-accent-green mb-2">{stat.value}</p>
                <p className="text-muted-foreground text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
