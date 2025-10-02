'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

function getOrCreateDeviceId() {
  try {
    const key = 'device_id'
    let id = localStorage.getItem(key)
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + ''
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return Math.random().toString(36).slice(2)
  }
}

export default function DeviceGate() {
  const supabase = createClient()
  const timer = useRef<any>(null)

  useEffect(() => {
    let mounted = true
    const device_id = getOrCreateDeviceId()
    const device_name = `${navigator.platform || 'Device'} · ${navigator.userAgent.split(')')[0].slice(0, 40)}`
    const user_agent = navigator.userAgent

    async function register(steal = true) {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/devices/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ device_id, device_name, user_agent, steal }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.warn('Device register failed', json)
        // If limit reached and stealing not allowed server-side, you could show a UI prompt.
      }
    }

    async function heartbeat() {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/devices/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ device_id }),
      }).catch(() => {})
    }

    register(true) // try to steal the oldest if at limit

    timer.current = setInterval(() => {
      if (!mounted) return
      heartbeat()
    }, 2 * 60 * 1000) // every 2 min

    return () => {
      mounted = false
      if (timer.current) clearInterval(timer.current)
    }
  }, [supabase])

  return null
}
