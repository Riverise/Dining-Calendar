import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import axios from 'axios'

const API_BASE = 'http://101.43.33.48:37767'

const initialForm = {
  title: '',
  location: '',
  category: '',
  participants: '',
  cost_total: '',
  rating: '',
  tags: '',
  notes: '',
  date: '',
  startTime: '18:00',
  endDate: '',
  endTime: '20:00',
  file: null
}

function App() {
  const [events, setEvents] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE}/events`)
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
          notes: event.notes,
          image_path: event.image_path
        }
      }))
      setEvents(mappedEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const resetForm = () => {
    setFormData(initialForm)
  }

  const handleDateClick = (arg) => {
    setFormData({ ...formData, date: arg.dateStr })
    setShowCreateModal(true)
  }

  const handleEventClick = (arg) => {
    setSelectedEvent(arg.event)
    setShowDetailModal(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    let imagePath = null
    if (formData.file) {
      const uploadData = new FormData()
      uploadData.append('file', formData.file)
      try {
        const uploadResponse = await axios.post(`${API_BASE}/upload-image`, uploadData, {
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

    const startDateTime = `${formData.date}T${formData.startTime || '00:00'}`
    const endDateTime = formData.endDate
      ? `${formData.endDate}T${formData.endTime || '00:00'}`
      : null

    const composedNotes = [
      formData.notes,
      formData.category ? `类型：${formData.category}` : '',
      endDateTime ? `结束：${endDateTime}` : ''
    ]
      .filter(Boolean)
      .join(' | ')

    const data = {
      title: formData.title,
      location: formData.location,
      participants: formData.participants.split(',').map(p => p.trim()).filter(Boolean),
      cost_total: parseFloat(formData.cost_total) || 0,
      rating: parseInt(formData.rating) || 0,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: composedNotes,
      date: startDateTime,
      image_path: imagePath
    }

    try {
      await axios.post(`${API_BASE}/events`, data)
      setShowCreateModal(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    try {
      await axios.delete(`${API_BASE}/events/${selectedEvent.id}`)
      setShowDetailModal(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <section className="max-w-6xl mx-auto p-4 space-y-6">
        <header className="flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">聚餐日历</p>
          <h1 className="text-3xl sm:text-4xl font-semibold">本月聚餐安排</h1>
          <p className="text-sm text-slate-500">点击日期即可填写事件，点击事件查看详情或删除。</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              height="650px"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
              }}
              dayMaxEvents={3}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">快速创建</h2>
            <p className="text-sm text-slate-500">单击日历日期后会弹出完整表单，先填写基础信息。</p>
            <div className="grid gap-3">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">时间</span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 border rounded-lg p-2 text-sm"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  <input
                    type="time"
                    className="w-24 border rounded-lg p-2 text-sm"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    className="flex-1 border rounded-lg p-2 text-sm"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    placeholder="结束日期"
                  />
                  <input
                    type="time"
                    className="w-24 border rounded-lg p-2 text-sm"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">类型 / 分类</span>
                <select
                  className="border rounded-lg p-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">请选择</option>
                  <option value="聚餐">聚餐</option>
                  <option value="团建">团建</option>
                  <option value="路演">路演</option>
                  <option value="小聚">小聚</option>
                </select>
              </div>
              <p className="text-xs text-slate-400">
                这些基础字段会加在备注中，方便在详情中整体查看。
              </p>
            </div>
          </div>
        </div>
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-10 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">创建新事件</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                关闭
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleFormSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  标题
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 border rounded-lg p-2"
                    required
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  地点
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1 border rounded-lg p-2"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  参与人 (逗号分隔)
                  <input
                    type="text"
                    value={formData.participants}
                    onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                    className="mt-1 border rounded-lg p-2"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  金额
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_total}
                    onChange={(e) => setFormData({ ...formData, cost_total: e.target.value })}
                    className="mt-1 border rounded-lg p-2"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  评分 (1-5)
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="mt-1 border rounded-lg p-2"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  标签 (逗号分隔)
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="mt-1 border rounded-lg p-2"
                  />
                </label>
              </div>

              <label className="flex flex-col text-sm font-medium text-slate-600">
                备注
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 border rounded-lg p-2"
                  rows="3"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-slate-600">
                上传图片
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  className="mt-1"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-10 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">日期</p>
                <p className="text-lg font-semibold">{selectedEvent.start}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-500 hover:text-slate-900 text-sm"
              >
                关闭
              </button>
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              <p><strong>标题:</strong> {selectedEvent.title}</p>
              <p><strong>地点:</strong> {selectedEvent.extendedProps.location}</p>
              <p><strong>参与人:</strong> {selectedEvent.extendedProps.participants.join(', ')}</p>
              <p><strong>金额:</strong> {selectedEvent.extendedProps.cost_total}</p>
              <p><strong>评分:</strong> {selectedEvent.extendedProps.rating}</p>
              <p><strong>标签:</strong> {selectedEvent.extendedProps.tags.join(', ')}</p>
              <p><strong>备注:</strong> {selectedEvent.extendedProps.notes}</p>
            </div>
            {selectedEvent.extendedProps.image_path && (
              <div className="mt-3">
                <strong>图片:</strong>
                <img
                  src={`${API_BASE}/${selectedEvent.extendedProps.image_path}`}
                  alt="Event"
                  className="w-full rounded-lg mt-2 object-cover max-h-60"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
