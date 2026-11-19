/// <reference types="vite/client" />

// 引入高德的全局类型（window.AMap 与 AMap 命名空间）
import '@amap/amap-jsapi-types'

declare global {
  interface ImportMetaEnv {
    /** 高德 Web端(JS API) Key，见 .env.example */
    readonly VITE_AMAP_KEY?: string
    /** 高德安全密钥 securityJsCode */
    readonly VITE_AMAP_SECURITY_CODE?: string
    /** 自定义地图样式 ID（amap://styles/ 之后的部分），可空 */
    readonly VITE_AMAP_STYLE_ID?: string
  }

  interface Window {
    /** 高德 SDK 加载前必须设置，见 src/lib/amap.ts */
    _AMapSecurityConfig?: {
      securityJsCode?: string
      serviceHost?: string
    }
  }

  /**
   * @amap/amap-jsapi-types 只覆盖核心 API，不含插件。
   * 这里补上用到的 AMap.Geolocation 声明。
   */
  namespace AMap {
    interface GeolocationOption {
      enableHighAccuracy?: boolean
      timeout?: number
      maximumAge?: number
      needAddress?: boolean
      showButton?: boolean
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    }

    interface GeolocationResult {
      position?: LngLat
      accuracy?: number
      location_type?: string
      message?: string
      info?: string
    }

    class Geolocation {
      constructor(opts?: GeolocationOption)
      getCurrentPosition(
        callback: (status: 'complete' | 'error' | 'no_data', result: GeolocationResult) => void,
      ): void
      getCityInfo(callback: (status: string, result: unknown) => void): void
    }
  }
}

export {}
