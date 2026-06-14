"use client"

import type React from "react"

import { useRef, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"
import {
  Shield,
  Search,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Lock,
  Brain,
  Users,
  Star,
  Zap,
  Globe,
  TrendingUp,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Features data
const features = [
  {
    icon: Shield,
    title: "User Verification",
    description: "CNIC validation, live photo matching, and optional 2FA for secure identity verification.",
  },
  {
    icon: Brain,
    title: "Fraud Detection",
    description: "Fraud scores and trust ratings continuously monitor and flag suspicious activities.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Escrow-based payment system holds funds until transaction completion.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Instant messaging between buyers and sellers with transaction tracking.",
  },
  {
    icon: Star,
    title: "Trust Ratings",
    description: "User reviews and ratings build community trust and accountability.",
  },
  {
    icon: Lock,
    title: "Dispute Resolution",
    description: "Fair dispute handling system with admin mediation support.",
  },
]

// How it works steps
const steps = [
  {
    step: "01",
    title: "Create Account",
    description: "Sign up and verify your identity through our secure verification process.",
  },
  {
    step: "02",
    title: "List or Browse",
    description: "Create listings to sell/rent items or browse available products.",
  },
  {
    step: "03",
    title: "Connect & Chat",
    description: "Message sellers directly and negotiate terms securely.",
  },
  {
    step: "04",
    title: "Secure Transaction",
    description: "Complete payment through our escrow system for protection.",
  },
]

// Benefits data
const benefits = [
  { icon: Users, title: "10K+", subtitle: "Active Users" },
  { icon: Globe, title: "50+", subtitle: "Cities Covered" },
  { icon: TrendingUp, title: "99.9%", subtitle: "Secure Transactions" },
  { icon: Zap, title: "24/7", subtitle: "Support Available" },
]

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const heroRef = useRef(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Trustify
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Benefits
              </a>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="ghost" size="sm">
                  Sign Up
                </Button>
              </Link>

              <ThemeToggle />
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border sm:hidden overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 bg-background">
                <a
                  href="#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#benefits"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Benefits
                </a>
                <div className="pt-2 border-t border-border space-y-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Sign Up
                    </Button>
                  </Link>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <motion.div style={{ y: backgroundY }} className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute inset-0 bg-[url('/grid-pattern-subtle.jpg')] opacity-5" />
        </motion.div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="text-center space-y-6 sm:space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Trusted Community Marketplace</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight"
            >
              <span className="text-foreground">Secure Platform for</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Renting, Buying & Selling
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed px-2"
            >
              Experience the future of peer-to-peer commerce in Pakistan with fraud detection, verified
              users, secure escrow payments, and real-time communication.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <Link href="/listings" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 text-sm sm:text-base"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  Explore Listings
                </Button>
              </Link>
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 bg-transparent text-sm sm:text-base"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Stats Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 pt-8 sm:pt-12 max-w-3xl mx-auto"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mb-2 sm:mb-3">
                    <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{benefit.title}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{benefit.subtitle}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          >
            <motion.div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* Introduction Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
            <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Revolutionizing Peer-to-Peer Commerce in Pakistan
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed"
            >
              There isn&apos;t a single digital platform in Pakistan that allows people to safely rent, purchase, or
              sell goods, properties and products with their identities confirmed. The lack of trust in current social
              media-based transactions results in fraud, unstable payments, and a breakdown in communication.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed"
            >
              Trustify solves this by establishing a trustworthy online marketplace with user verification, payment
              security, and open communication as fundamental standards. Through comprehensive verification including
              CNIC validation, live photo matching, and fraud score monitoring, we enable secure peer-to-peer
              transactions in local communities.
            </motion.p>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Why Choose Trustify?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Our platform combines cutting-edge technology with user-centric design to create the safest marketplace
              experience.
            </motion.p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20">
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              How Trustify Works
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Get started in four simple steps and experience secure peer-to-peer transactions.
            </motion.p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-4" />
                )}
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl sm:text-2xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="benefits" className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <AnimatedSection className="space-y-4 sm:space-y-6">
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-4xl font-bold">
                Why Trustify is Secure
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed"
              >
                Your safety is our priority. We&apos;ve built multiple layers of protection to ensure every transaction
                is secure.
              </motion.p>
              <motion.ul variants={staggerContainer} className="space-y-3 sm:space-y-4">
                {[
                  "End-to-end encrypted communications",
                  "Fraud score & trust rating system",
                  "Escrow-based payment protection",
                  "Identity verification with CNIC",
                  "24/7 dispute resolution support",
                  "Real-time transaction monitoring",
                ].map((item, index) => (
                  <motion.li key={index} variants={fadeInUp} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm sm:text-base text-foreground">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div variants={fadeInUp}>
                <Link href="/signup" className="inline-block">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm sm:text-base"
                  >
                    Start Secure Trading
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </motion.div>
            </AnimatedSection>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative order-first lg:order-last"
            >
              <div className="aspect-square max-w-xs sm:max-w-sm md:max-w-md mx-auto rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 p-6 sm:p-8 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                  <Shield className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 text-primary relative z-10" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Policies Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-8 sm:mb-12 md:mb-16">
            <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Our Policies
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Transparent policies that protect both buyers and sellers in every transaction.
            </motion.p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                title: "User Protection",
                description:
                  "All users go through a verification process. We protect your personal data with industry-standard encryption and never share it with third parties.",
              },
              {
                title: "Fraud Prevention",
                description:
                  "Our AI continuously monitors for suspicious activities. Any fraudulent behavior results in immediate account suspension and potential legal action.",
              },
              {
                title: "Safety Guidelines",
                description:
                  "We recommend meeting in public places, verifying items before payment release, and using our escrow system for all transactions.",
              },
            ].map((policy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-card border-border/50">
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">{policy.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{policy.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-accent p-6 sm:p-8 md:p-12 lg:p-16 text-center"
          >
            <div className="absolute inset-0 bg-[url('/grid-pattern-subtle.jpg')] opacity-10" />
            <div className="relative z-10 space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
                Ready to Start Trading Securely?
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Join thousands of verified users already enjoying secure peer-to-peer transactions on Trustify.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 text-sm sm:text-base">
                    Create Free Account
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Link href="/listings" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-sm sm:text-base"
                  >
                    Browse Listings
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
