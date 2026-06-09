"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceMessageProps {
  audioUrl?: string
  duration: number
  isOwn: boolean
}

export function VoiceMessage({ audioUrl, duration, isOwn }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const handleCanPlay = () => setIsLoaded(true)
    const handleError = () => setHasError(true)

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("canplaythrough", handleCanPlay)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("canplaythrough", handleCanPlay)
      audio.removeEventListener("error", handleError)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || hasError) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Generate waveform bars
  const waveformBars = Array.from({ length: 20 }, (_, i) => {
    const heights = [40, 60, 80, 50, 90, 70, 45, 85, 55, 75, 65, 95, 50, 80, 60, 70, 85, 45, 75, 55]
    return heights[i % heights.length]
  })

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-full flex-shrink-0 ${
          isOwn
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        }`}
        onClick={togglePlay}
        disabled={hasError}
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
      </Button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform visualization */}
        <div className="flex items-center gap-[2px] h-6">
          {waveformBars.map((height, i) => {
            const barProgress = (i / waveformBars.length) * 100
            const isActive = barProgress <= progress

            return (
              <motion.div
                key={i}
                className={`w-[3px] rounded-full transition-colors ${
                  isOwn
                    ? isActive
                      ? "bg-primary-foreground"
                      : "bg-primary-foreground/40"
                    : isActive
                      ? "bg-primary"
                      : "bg-primary/30"
                }`}
                style={{ height: `${height}%` }}
                animate={isPlaying && isActive ? { scaleY: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3, repeat: Number.POSITIVE_INFINITY }}
              />
            )
          })}
        </div>

        {/* Time display */}
        <div className="flex justify-between">
          <span className={`text-[10px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {formatTime(currentTime)}
          </span>
          <span className={`text-[10px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
