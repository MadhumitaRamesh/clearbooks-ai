import { RecordDetail, RecordStatus } from '../types/api';

const generateMockData = (id: string, type: 'image' | 'audio', status: RecordStatus = 'done'): RecordDetail => ({
  record: {
    id,
    status,
    source_type: type,
    created_at: new Date().toISOString(),
  },
  extracted: {
    raw_text: type === 'image' ? '10 Rice 50\n2 Sugar 30' : 'Sold 10 bags of rice at 50 each, and 2 sugar at 30',
    structured: {
      transactions: [
        { item: 'Rice (5kg)', quantity: 10, unit_price: 50, total: 500, type: 'sale', date: new Date().toISOString().split('T')[0] },
        { item: 'Sugar (1kg)', quantity: 2, unit_price: 30, total: 60, type: 'sale', date: new Date().toISOString().split('T')[0] }
      ]
    }
  },
  insights: {
    summary: 'Strong sales on staples today. Consider restocking Sugar soon.',
    top_items: [
      { item: 'Rice (5kg)', total_sales: 500 },
      { item: 'Sugar (1kg)', total_sales: 60 }
    ],
    predictions: [
      { item: 'Rice (5kg)', predicted_demand_next_week: 15 },
      { item: 'Sugar (1kg)', predicted_demand_next_week: 5 }
    ],
    alerts: ['⚠️ Sugar stock running low — reorder soon']
  }
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const simulateError = () => {
  if (Math.random() < 0.1) throw new Error('Simulated network error');
};

export async function mockUploadImage(uri: string): Promise<RecordDetail> {
  await delay(1500);
  simulateError();
  return generateMockData(`rec_${Date.now()}`, 'image');
}

export async function mockUploadAudio(uri: string): Promise<RecordDetail> {
  await delay(1500);
  simulateError();
  return generateMockData(`rec_${Date.now()}`, 'audio');
}

export async function mockGetRecord(id: string): Promise<RecordDetail> {
  await delay(1000);
  simulateError();
  return generateMockData(id, 'image');
}

export async function mockGetHistory(): Promise<RecordDetail['record'][]> {
  await delay(1000);
  simulateError();
  return [
    { id: 'rec_3', status: 'done', source_type: 'image', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'rec_2', status: 'processing', source_type: 'audio', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'rec_1', status: 'failed', source_type: 'image', created_at: new Date(Date.now() - 100000).toISOString() }
  ];
}

export async function mockGetDashboard(): Promise<RecordDetail['insights']> {
  await delay(800);
  simulateError();
  return generateMockData('dash', 'image').insights;
}
