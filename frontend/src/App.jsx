import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import axios from 'axios'

function App() {
  const [events, setEvents] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    participants: '',
    cost_total: '',
    rating: '',
    tags: '',
    date: '',
    file: null
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://101.43.33.48:37767/events')
      const mappedEvents = response.data.map(event => ({
        id: event.id,
        title: event.title,
        start: event.date,
        extendedProps: {
          location: event.location,
          participants: event.participants,
          cost_total: event.cost_total,
          rating: event.rating,
          tags: event.tags,
          image_path: event.image_path
        }
      }))
      setEvents(mappedEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const handleDateClick = (arg) => {
    setFormData({ ...formData, date: arg.dateStr })
    setShowCreateModal(true)
  }

  const handleEventClick = (arg) => {
    const event = events.find(e => e.id == arg.event.id)
    setSelectedEvent(event)
    setShowDetailModal(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    let imagePath = null
    if (formData.file) {
      const uploadData = new FormData()
      uploadData.append('file', formData.file)
      try {
        const uploadResponse = await axios.post('http://101.43.33.48:37767/upload-image', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        imagePath = uploadResponse.data.path
      } catch (error) {
        console.error('Error uploading image:', error)
        return
      }
    }
    const data = {
      title: formData.title,
      location: formData.location,
      participants: formData.participants.split(',').map(p => p.trim()),
      cost_total: parseFloat(formData.cost_total),
      rating: parseInt(formData.rating),
      tags: formData.tags.split(',').map(t => t.trim()),
      date: formData.date,
      image_path: imagePath
    }
    try {
      await axios.post('http://101.43.33.48:37767/events', data)
      setShowCreateModal(false)
      setFormData({
        title: '',
        location: '',
        participants: '',
        cost_total: '',
        rating: '',
        tags: '',
        date: '',
        file: null
      })
      fetchEvents()
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`http://101.43.33.48:37767/events/${selectedEvent.id}`)
      setShowDetailModal(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-8">聚餐日历</h1>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
        />
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">创建新事件</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">地点</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">参与人 (逗号分隔)</label>
                <input
                  type="text"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_total}
                  onChange={(e) => setFormData({ ...formData, cost_total: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">评分 (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">标签 (逗号分隔)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">上传图片</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="mr-2 px-4 py-2 bg-gray-300 rounded"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">事件详情</h2>
            <p><strong>标题:</strong> {selectedEvent.title}</p>
            <p><strong>日期:</strong> {selectedEvent.start}</p>
            <p><strong>地点:</strong> {selectedEvent.extendedProps.location}</p>
            <p><strong>参与人:</strong> {selectedEvent.extendedProps.participants.join(', ')}</p>
            <p><strong>金额:</strong> {selectedEvent.extendedProps.cost_total}</p>
            <p><strong>评分:</strong> {selectedEvent.extendedProps.rating}</p>
            <p><strong>标签:</strong> {selectedEvent.extendedProps.tags.join(', ')}</p>
            {selectedEvent.extendedProps.image_path && (
              <div className="mt-4">
                <strong>图片:</strong>
                <img
                  src={`http://101.43.33.48:37767/${selectedEvent.extendedProps.image_path}`}
                  alt="Event"
                  className="w-full mt-2 rounded"
                />
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="mr-2 px-4 py-2 bg-gray-300 rounded"
              >
                关闭
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
