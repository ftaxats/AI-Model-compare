import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchService {
  search(query: string, maxResults?: number): Promise<SearchResult[]>;
}

export class DuckDuckGoSearch implements WebSearchService {
  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: {
          q: query,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      $('.web-result').each((i, element) => {
        if (results.length >= maxResults) return false;

        const $elem = $(element);
        const title = $elem.find('.result__title a').text().trim();
        const url = $elem.find('.result__title a').attr('href') || '';
        const snippet = $elem.find('.result__snippet').text().trim();

        if (title && url && snippet) {
          results.push({
            title,
            url: url.startsWith('//') ? 'https:' + url : url,
            snippet
          });
        }
      });

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
}

export class GoogleSearch implements WebSearchService {
  private apiKey: string;
  private searchEngineId: string;

  constructor(apiKey?: string, searchEngineId?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID || '';
  }

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Search API key and Search Engine ID required');
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: Math.min(maxResults, 10)
        }
      });

      const results: SearchResult[] = response.data.items?.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet
      })) || [];

      return results;
    } catch (error) {
      console.error('Google Search error:', error);
      return [];
    }
  }
}

// Factory function to get the appropriate search service
export function createSearchService(): WebSearchService {
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (googleApiKey && googleSearchEngineId) {
    return new GoogleSearch(googleApiKey, googleSearchEngineId);
  } else {
    return new DuckDuckGoSearch();
  }
}

export async function searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const searchService = createSearchService();
  return await searchService.search(query, maxResults);
}