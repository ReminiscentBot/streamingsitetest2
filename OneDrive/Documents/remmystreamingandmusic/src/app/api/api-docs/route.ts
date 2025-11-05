import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { withRequestLogging } from '@/lib/security/api-request-logger-wrapper'

interface Endpoint {
  path: string
  methods: string[]
  filePath: string
}

/**
 * Recursively scan API directory for route handlers
 */
async function scanApiDirectory(dir: string, basePath: string = ''): Promise<Endpoint[]> {
  const endpoints: Endpoint[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subEndpoints = await scanApiDirectory(fullPath, relativePath)
      endpoints.push(...subEndpoints)
    } else if (entry.name === 'route.ts') {
      // Found a route handler
      try {
        // Read the file to extract exported methods
        const { readFileSync } = await import('fs')
        const content = readFileSync(fullPath, 'utf-8')
        
        // Extract exported HTTP methods
        const methods: string[] = []
        const methodPattern = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(/gi
        let match
        while ((match = methodPattern.exec(content)) !== null) {
          methods.push(match[2].toUpperCase())
        }

        if (methods.length > 0) {
          // Convert file path to API path
          let apiPath = basePath
            .replace(/\[([^\]]+)\]/g, ':$1') // Convert [id] to :id
            .replace(/\/route$/, '') // Remove /route suffix

          // Handle root route
          if (!apiPath) {
            apiPath = '/api'
          } else {
            apiPath = `/api${apiPath.startsWith('/') ? '' : '/'}${apiPath}`
          }

          endpoints.push({
            path: apiPath,
            methods,
            filePath: fullPath
          })
        }
      } catch (error) {
        console.error(`Error reading route file ${fullPath}:`, error)
      }
    }
  }

  return endpoints
}

async function getHandler(req: NextRequest) {
  try {
    const apiDir = join(process.cwd(), 'src', 'app', 'api')
    const endpoints = await scanApiDirectory(apiDir)

    return NextResponse.json({ endpoints })
  } catch (error) {
    console.error('Error scanning API directory:', error)
    return NextResponse.json({ error: 'Failed to scan API directory' }, { status: 500 })
  }
}

export const GET = withRequestLogging(getHandler)

