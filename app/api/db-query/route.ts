import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { query: userQuery } = await req.json();
    
    if (!userQuery || typeof userQuery !== 'string') {
      return Response.json({
        success: false,
        message: 'Brak zapytania SQL'
      }, { status: 400 });
    }

    const result = await query(userQuery);
    
    return Response.json({
      success: true,
      message: 'Zapytanie wykonane pomyślnie',
      data: {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(f => f.name)
      }
    });
  } catch (error) {
    console.error('Database query error:', error);
    return Response.json({
      success: false,
      message: 'Błąd wykonania zapytania',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
