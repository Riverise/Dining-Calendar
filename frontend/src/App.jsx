import { useState, useEffect } from 'react' //React Hooks：useState 管理状态，useEffect 处理副作用（如组件挂载时获取数据）。
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import axios from 'axios'

const API_BASE = 'http://101.43.33.48:37767' //后端URL

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
} // 表单初始状态对象：定义表单字段的默认值

function App() { //下面是函数体
  const [events, setEvents] = useState([]) // useState Hook：管理日历事件列表状态
  const [showCreateModal, setShowCreateModal] = useState(false) // 是否显示创建模态框
  const [showDetailModal, setShowDetailModal] = useState(false) // 是否显示详情模态框
  const [selectedEvent, setSelectedEvent] = useState(null) // 当前选中的事件
  const [formData, setFormData] = useState(initialForm) // 表单数据状态
  const [toast, setToast] = useState({ show: false, message: '' }) // Toast 提示状态

  useEffect(() => { // useEffect Hook：组件挂载时执行，获取事件数据
    fetchEvents()
  }, [])

  const fetchEvents = async () => { // 异步函数：从后端获取事件列表，映射为 FullCalendar 格式
    try {
      const response = await axios.get(`${API_BASE}/events`) // GET 请求获取事件
      // map 函数：将后端数据转换为前端需要的格式
      const mappedEvents = response.data.map(event => ({
        id: event.id,
        title: event.title,
        start: event.date, // 开始时间
        end: event.end_datetime || null, // 结束时间（可选）
        extendedProps: { // 扩展属性：存储额外数据
          location: event.location,
          category: event.category,
          participants: event.participants || [],
          cost_total: event.cost_total,
          rating: event.rating,
          tags: event.tags || [],
          notes: event.notes,
          image_path: event.image_path,
          end_datetime: event.end_datetime
        }
      }))
      setEvents(mappedEvents) // 更新状态
    } catch (error) {
      console.error('Error fetching events:', error)
      setToast({ show: true, message: error?.response?.data?.detail || '获取事件失败' }) // 显示错误 Toast
    }
  }

  const resetForm = () => { // 函数：重置表单数据
    setFormData(initialForm)
  }

  const handleDateClick = (arg) => { // 事件处理函数：点击日历日期时触发
    setFormData({ ...formData, date: arg.dateStr }) // 更新表单日期
    setShowCreateModal(true) // 显示创建模态框
  }

  const handleEventClick = (arg) => { // 事件处理函数：点击日历事件时触发
    setSelectedEvent(arg.event) // 设置选中事件
    setShowDetailModal(true) // 显示详情模态框
  }

  const handleFormSubmit = async (e) => { // 异步事件处理函数：表单提交，创建新事件
    e.preventDefault() // 阻止默认表单提交
    let imagePath = null
    if (formData.file) { // 如果有文件，上传图片
      const uploadData = new FormData() // FormData：用于文件上传
      uploadData.append('file', formData.file)
      try {
        const uploadResponse = await axios.post(`${API_BASE}/upload-image`, uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data' // 设置请求头
          }
        })
        imagePath = uploadResponse.data.path // 获取上传路径
      } catch (error) {
        console.error('Error uploading image:', error)
        return // 上传失败，停止提交
      }
    }

    // 拼接日期时间字符串
    const startDateTime = formData.date ? `${formData.date}T${formData.startTime || '00:00'}` : ''
    const endDateTime = formData.endDate
      ? `${formData.endDate}T${formData.endTime || '00:00'}`
      : null

    // 准备提交数据：转换类型（如数组、数字）
    const data = {
      title: formData.title,
      location: formData.location,
      category: formData.category,
      participants: formData.participants.split(',').map(p => p.trim()).filter(Boolean), // 字符串转数组
      cost_total: parseFloat(formData.cost_total) || 0, // 字符串转数字
      rating: parseInt(formData.rating) || 0,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: formData.notes,
      date: startDateTime,
      end_datetime: endDateTime,
      image_path: imagePath
    }

    try {
      await axios.post(`${API_BASE}/events`, data) // POST 请求创建事件
      setShowCreateModal(false) // 关闭模态框
      resetForm() // 重置表单
      fetchEvents() // 刷新事件列表
    } catch (error) {
      console.error('Error creating event:', error)
      setToast({ show: true, message: error?.response?.data?.detail || '创建事件失败' }) // 显示错误 Toast
    }
  }

  const handleDelete = async () => { // 异步事件处理函数：删除事件
    if (!selectedEvent) return
    try {
      await axios.delete(`${API_BASE}/events/${selectedEvent.id}`) // DELETE 请求
      setShowDetailModal(false) // 关闭详情模态框
      setSelectedEvent(null) // 清空选中事件
      fetchEvents() // 刷新列表
    } catch (error) {
      console.error('Error deleting event:', error)
      setToast({ show: true, message: error?.response?.data?.detail || '删除事件失败' }) // 显示错误 Toast
    }
  }

  return ( // JSX 返回：渲染 UI
    <main className="min-h-screen bg-slate-100 text-slate-800"> {/* 主容器：Tailwind 类名用于样式 */}
      <section className="max-w-6xl mx-auto p-4 space-y-6"> {/* 内容区域 */}
        <header className="flex flex-col gap-2 text-center"> {/* 头部 */}
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">聚餐日历</p>
          <h1 className="text-3xl sm:text-4xl font-semibold">本月聚餐安排</h1>
          <p className="text-sm text-slate-500">点击日期即可填写事件，点击事件查看详情或删除。</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"> {/* 网格布局：响应式 */}
          <div className="bg-white rounded-2xl shadow-lg p-4"> {/* 日历容器 */}
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]} // 插件配置
              initialView="dayGridMonth" // 初始视图：月视图
              events={events} // 事件数据
              dateClick={handleDateClick} // 日期点击事件
              eventClick={handleEventClick} // 事件点击事件
              height="650px" // 高度
              headerToolbar={{ // 头部工具栏
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
              }}
              dayMaxEvents={3} // 每天最多显示 3 个事件
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4"> {/* 侧边栏 */}
            <h2 className="text-xl font-semibold">快速创建</h2>
            <p className="text-sm text-slate-500">单击日历日期后会弹出完整表单，先填写基础信息。</p>
            <div className="grid gap-3">
              {/* 时间输入区域 */}
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">时间</span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 border rounded-lg p-2 text-sm"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })} // onChange：更新状态
                  />
                  <input
                    type="time"
                    className="w-24 border rounded-lg p-2 text-sm"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                {/* 结束时间 */}
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
              {/* 类别选择 */}
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">类型 / 分类</span>
                <select
                  className="border rounded-lg p-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })} // select 的 onChange
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

      {/* 条件渲染：创建模态框 */}
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
            {/* 表单：onSubmit 绑定事件 */}
            <form className="space-y-3" onSubmit={handleFormSubmit}>
              {/* 网格布局：响应式列 */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-slate-600">
                  标题
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 border rounded-lg p-2"
                    required // HTML 属性：必填
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

              {/* 其他表单字段：类似结构 */}
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
                  rows="3" // HTML 属性：行数
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-slate-600">
                上传图片
                <input
                  type="file"
                  accept="image/*" // 限制文件类型
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })} // 文件选择
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

      {/* 条件渲染：详情模态框 */}
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
            {/* 事件详情列表 */}
            <div className="space-y-1 text-sm text-slate-700">
              <p><strong>标题:</strong> {selectedEvent.title}</p>
              <p><strong>地点:</strong> {selectedEvent.extendedProps.location}</p>
              <p><strong>类别:</strong> {selectedEvent.extendedProps.category || '-'}</p>
              <p><strong>参与人:</strong> {(selectedEvent.extendedProps.participants || []).join(', ')}</p>
              <p><strong>金额:</strong> {selectedEvent.extendedProps.cost_total}</p>
              <p><strong>评分:</strong> {selectedEvent.extendedProps.rating}</p>
              <p><strong>标签:</strong> {(selectedEvent.extendedProps.tags || []).join(', ')}</p>
              <p><strong>开始:</strong> {selectedEvent.start}</p>
              <p><strong>结束:</strong> {selectedEvent.extendedProps.end_datetime || '-'}</p>
              <p><strong>备注:</strong> {selectedEvent.extendedProps.notes}</p>
            </div>
            {/* 图片显示：条件渲染 */}
            <div className="mt-3">
              <strong>图片:</strong>
              <img
                src={
                  selectedEvent.extendedProps.image_path
                    ? `${API_BASE}/${selectedEvent.extendedProps.image_path}` // 动态 URL
                    : "data:image/svg+xml;utf8,\n%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='28' fill='%23737b84'%3E聚餐占位图%3C/text%3E%3C/svg%3E" // 内联 SVG data URI
                }
                alt="Event"
                className="w-full rounded-lg mt-2 object-cover max-h-60"
              />
            </div>
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
      {/* Toast 组件：显示在页面右上角 */}
      <Toast toast={toast} setToast={setToast} />
    </main>
  )
}

// Toast component render outside main markup so it appears on top-right
function Toast({ toast, setToast }) { // Toast 子组件：自定义组件，用于显示提示消息
  useEffect(() => { // useEffect：在 Toast 显示时设置定时器
    if (toast.show) {
      const t = setTimeout(() => setToast({ show: false, message: '' }), 4000) // 4 秒后自动隐藏
      return () => clearTimeout(t) // 清理定时器
    }
  }, [toast, setToast]) // 依赖数组

  if (!toast.show) return null // 条件渲染：不显示时返回 null
  return (
    <div className="fixed right-4 top-4 z-50"> {/* 固定定位 */}
      <div className="bg-black/80 text-white px-4 py-2 rounded shadow">{toast.message}</div>
    </div>
  )
}

// 导出：默认导出组件
export default App
