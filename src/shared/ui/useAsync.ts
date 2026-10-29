import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
}

/**
 * Loads data and reloads it when `key` changes, on demand, and when another
 * tab writes to localStorage (so tabs of the same browser stay in sync).
 */
export function useAsync<T>(load: () => Promise<T>, key: string): AsyncState<T> {
  const [state, setState] = useState<{ data?: T; error?: unknown; loading: boolean }>({ loading: true })
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let alive = true
    load().then(
      (data) => alive && setState({ data, loading: false }),
      (error) => alive && setState({ error, loading: false }),
    )
    return () => {
      alive = false
    }
    // `load` is recreated each render; `key` and `tick` drive reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick])

  useEffect(() => {
    const onStorage = () => reload()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [reload])

  return { data: state.data, error: state.error, loading: state.loading, reload }
}
