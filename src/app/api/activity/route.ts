import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle activity tracking logic here
    console.log('Activity tracked:', body)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Activity tracking error:', error)
    return NextResponse.json({ error: 'Failed to track activity' }, { status: 500 })
  }
}