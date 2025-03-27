/**
 * Type definitions for MapQuest JavaScript API
 */

import { Coordinates } from "@/services/mapquest";

declare namespace L {
  interface LatLngExpression {
    lat: number;
    lng: number;
  }

  interface MapOptions {
    center: LatLngExpression;
    layers?: any[];
    zoom?: number;
  }

  interface AnimatedViewOptions {
    animate?: boolean;
    duration?: number;
  }

  interface MarkerOptions {
    icon?: any;
    title?: string;
    zIndexOffset?: number;
  }

  interface CircleOptions {
    radius: number;
    weight: number;
    color: string;
    fillColor: string;
    fillOpacity: number;
  }

  interface Map {
    setView(center: LatLngExpression | [number, number], zoom: number, options?: AnimatedViewOptions): this;
    addControl(control: any): this;
    on(event: string, handler: Function): this;
    zoomIn(): void;
    zoomOut(): void;
    removeLayer(layer: any): this;
    remove(): void;
  }

  interface Marker {
    on(event: string, handler: Function): this;
    bindPopup(content: string): this;
  }
}

// Global type augmentation for window.L
declare global {
  interface Window {
    L: {
      mapquest: {
        key: string;
        map: (element: string, options: any) => L.Map;
        tileLayer: (type: string) => any;
        control: () => any;
        directionsLayer: (options: any) => any;
        icons: {
          circle: (options: any) => any;
          marker: (options: any) => any;
        };
      };
      marker: (position: Coordinates, options?: any) => L.Marker;
      circle: (position: [number, number], options?: L.CircleOptions) => any;
    };
  }
}