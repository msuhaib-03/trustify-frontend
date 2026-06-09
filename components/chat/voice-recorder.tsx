"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Mic, Square, Send, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => Promise<void>
  disabled?: boolean
}

export function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setPermissionDenied(false)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Failed to start recording:", error)
      setPermissionDenied(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const cancelRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
  }

  const handleSend = async () => {
    if (!audioBlob) return

    setIsSending(true)
    try {
      await onSend(audioBlob, recordingTime)
      cancelRecording()
    } catch (error) {
      console.error("Failed to send voice message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (permissionDenied) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={() => setPermissionDenied(false)}
        title="Microphone permission denied"
      >
        <Mic className="h-5 w-5" />
      </Button>
    )
  }

  // Show preview mode when we have recorded audio
  if (audioUrl && audioBlob) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={cancelRecording}
          disabled={isSending}
        >
          <X className="h-4 w-4" />
        </Button>

        <audio ref={audioRef} src={audioUrl} className="hidden" />

        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary rounded-full"
                initial={{ height: 8 }}
                animate={{ height: Math.random() * 16 + 8 }}
                transition={{ duration: 0.3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: i * 0.05 }}
              />
            ))}
          </div>
          <span className="text-sm font-medium min-w-[40px]">{formatTime(recordingTime)}</span>
        </div>

        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 bg-primary hover:bg-primary/90"
          onClick={handleSend}
          disabled={isSending}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </motion.div>
    )
  }

  // Show recording mode
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 bg-destructive/10 rounded-full px-3 py-1.5"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={cancelRecording}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-destructive"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
          />
          <span className="text-sm font-medium text-destructive min-w-[40px]">{formatTime(recordingTime)}</span>
        </div>

        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={stopRecording}>
          <Square className="h-3 w-3 fill-current" />
        </Button>
      </motion.div>
    )
  }

  // Default state - mic button
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
      onClick={startRecording}
      disabled={disabled}
      title="Record voice message"
    >
      <Mic className="h-5 w-5" />
    </Button>
  )
}
