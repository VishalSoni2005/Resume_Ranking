"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"

interface FileUploadProps {
  onFileChange: (files: File[]) => void
}

export default function FileUpload({ onFileChange }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(filesArray)
      onFileChange(filesArray)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files)
      const validFiles = filesArray.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles)
        onFileChange(validFiles)
      }
    }
  }

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium">
          Drag & drop your CVs here
          <br />
          or click to browse
        </p>

        {/* //! input section to upload files */}
        <p className="mt-1 text-xs text-gray-500">(Supports PDF and DOCX files)</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx"
          multiple
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Selected Files:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {selectedFiles.map((file, index) => (
              <li key={index} className="truncate">
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
