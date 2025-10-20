import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    
    return Response.json({
      success: true,
      message: 'Połączenie z bazą danych działa poprawnie',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return Response.json({
      success: false,
      message: 'Błąd połączenia z bazą danych',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
