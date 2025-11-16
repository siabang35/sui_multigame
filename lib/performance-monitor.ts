'use client';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private maxSamples = 60;

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last N samples
    if (values.length > this.maxSamples) {
      values.shift();
    }
  }

  getMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;

    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getAllMetrics(): Record<string, number> {
    const result: Record<string, number> = {};

    this.metrics.forEach((values, name) => {
      result[name] = this.getMetric(name);
    });

    return result;
  }

  logMetrics(): void {
    const metrics = this.getAllMetrics();
    console.table(metrics);
  }

  // Web Vitals tracking
  trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.log('[Performance] LCP tracking not supported');
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('FID', entry.processingDuration);
          });
        });

        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.log('[Performance] FID tracking not supported');
      }

      // CLS (Cumulative Layout Shift)
      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              this.recordMetric('CLS', entry.value);
            }
          });
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('[Performance] CLS tracking not supported');
      }
    }
  }
}

export const performanceMonitor = typeof window !== 'undefined'
  ? new PerformanceMonitor()
  : null;
