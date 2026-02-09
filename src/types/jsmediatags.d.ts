declare module 'jsmediatags' {
  interface Tags {
    title?: string
    artist?: string
    album?: string
    year?: string
    genre?: string
    track?: string
    comment?: string
    lyrics?: string
    picture?: {
      format: string
      type: string
      description: string
      data: number[]
    }
  }

  interface TagResult {
    type: string
    tags: Tags
  }

  interface ReadCallbacks {
    onSuccess: (result: TagResult) => void
    onError: (error: { type: string; info: string }) => void
  }

  function read(file: File | string | Blob, callbacks: ReadCallbacks): void

  export default { read }
}
