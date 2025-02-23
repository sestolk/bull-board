import { useEffect, useRef, useState } from 'react'
import qs from 'querystring'

const interval = 5000

export default function useStore(basePath) {
  const [state, setState] = useState({
    data: null,
    loading: true,
  })
  const [selectedStatuses, setSelectedStatuses] = useState({})

  const poll = useRef()

  useEffect(() => {
    stopPolling()
    runPolling()
    return stopPolling
  }, [selectedStatuses])

  const stopPolling = () => {
    if (poll.current) {
      clearTimeout(poll.current)
      poll.current = null
    }
  }

  const runPolling = () => {
    update()
      .catch(error => {
        console.error('Failed to poll', error)
      })
      .then(() => {
        const timeoutId = setTimeout(() => {
          runPolling()
        }, interval)
        poll.current = timeoutId
      })
  }

  const update = () => {
    return fetch(`${basePath}/queues/?${qs.encode(selectedStatuses)}`)
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(data => setState({ data, loading: false }))
  }

  const retryJob = queueName => job => () =>
    fetch(`${basePath}/queues/${queueName}/${job.id}/retry`, {
      method: 'put',
    }).then(update)

  const retryAll = queueName => () =>
    fetch(`${basePath}/queues/${queueName}/retry`, { method: 'put' }).then(
      update,
    )

  const cleanAll = queueName => () =>
    fetch(`${basePath}/queues/${queueName}/clean`, { method: 'put' }).then(
      update,
    )

  return {
    state,
    retryJob,
    retryAll,
    cleanAll,
    selectedStatuses,
    setSelectedStatuses,
  }
}
