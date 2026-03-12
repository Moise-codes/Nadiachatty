import { format, isToday, isYesterday } from 'date-fns'

export const formatMsgTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'h:mm a')
}

export const formatDateDivider = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

export const getAvatarUrl = (name, pic) => {
  if (pic) return pic
  const n = encodeURIComponent(name || 'U')
  return `https://ui-avatars.com/api/?name=${n}&background=7c3aed&color=fff&size=128&bold=true`
}

export const truncate = (str, n = 36) =>
  str && str.length > n ? str.slice(0, n) + '…' : str

export const isDifferentDay = (d1, d2) => {
  if (!d1 || !d2) return true
  const a = new Date(d1), b = new Date(d2)
  return a.getFullYear() !== b.getFullYear() ||
         a.getMonth()    !== b.getMonth()    ||
         a.getDate()     !== b.getDate()
}
