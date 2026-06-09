"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatSuggestionsProps {
  onSelect: (message: string) => void
  show: boolean
}

const suggestions = [
  "Hi, is this item still available?",
  "Can you share more details about the condition?",
  "Is the price negotiable?",
  "When would be a good time to meet?",
  "Can you provide more photos?",
]

export function ChatSuggestions({ onSelect, show }: ChatSuggestionsProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="p-3 sm:p-4 bg-muted/50 border-b"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-full bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">Suggested messages</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm h-auto py-1.5 px-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
              onClick={() => onSelect(suggestion)}
            >
              {suggestion}
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
