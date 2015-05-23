/**
 * Response from API which is limited to `size` records per page.
 */
interface PaginatedResponse {
  /**
   * Number of all records.
   * @type {number}
   */
  count: number;
  /**
   * An array of actual records, size matches `size` attribute (url param).
   * @type {Array<any>}
   */
  records: Array<any>;
  /**
   * The `page` url param for previous page (null if this is first page).
   * @type {number}
   */
  previousPage: number;
  /**
   * Position of last element in search results list (totalIndex + 1).
   * TODO: Check if true for all API endpoints.
   * @type {number}
   */
  anchor?: number;
  /**
   * The `page` url param for next page (null if this is last page).
   * @type {number}
   */
  nextPage: number;
  /**
   * Size of search response. Vine API sets limit 1 - 60.
   * @type {number}
   */
  size: number;
}
