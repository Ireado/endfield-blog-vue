export const fmtDate = (d: string) => d.replace(/-/g, '.')

export const fmtNum = (n: number) => n.toLocaleString('en-US')

export const pad2 = (n: number | string) => String(n).padStart(2, '0')
