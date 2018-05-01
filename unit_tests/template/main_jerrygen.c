/* Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "jerryscript.h"
#include "jerryscript-ext/handler.h"
#include "jerryscript-port.h"
#include "jerryscript-port-default.h"

#include "webidl_compiler_utilities.h"

/**
 * Maximum size of source code
 */
#define JERRY_BUFFER_SIZE (1048576)

/**
 * Maximum size of snapshots buffer
 */
#define JERRY_SNAPSHOT_BUFFER_SIZE (JERRY_BUFFER_SIZE / sizeof (uint32_t))

/**
 * Standalone Jerry exit codes
 */
#define JERRY_STANDALONE_EXIT_CODE_OK   (0)
#define JERRY_STANDALONE_EXIT_CODE_FAIL (1)

/**
 * Context size of the SYNTAX_ERROR
 */
#define SYNTAX_ERROR_CONTEXT_SIZE 2

static uint8_t buffer[ JERRY_BUFFER_SIZE ];

static const uint32_t *
read_file (const char *file_name,
           size_t *out_size_p)
{
  FILE *file;
  if (!strcmp ("-", file_name))
  {
    file = stdin;
  }
  else
  {
    file = fopen (file_name, "r");
    if (file == NULL)
    {
      jerry_port_log (JERRY_LOG_LEVEL_ERROR, "Error: failed to open file: %s\n", file_name);
      return NULL;
    }
  }

  size_t bytes_read = fread (buffer, 1u, sizeof (buffer), file);
  if (!bytes_read)
  {
    jerry_port_log (JERRY_LOG_LEVEL_ERROR, "Error: failed to read file: %s\n", file_name);
    fclose (file);
    return NULL;
  }

  fclose (file);

  *out_size_p = bytes_read;
  return (const uint32_t *) buffer;
} /* read_file */

/**
 * Print error value
 */
static void
print_unhandled_exception (jerry_value_t error_value) /**< error value */
{
  assert (!jerry_value_has_error_flag (error_value));

  jerry_value_t err_str_val = jerry_value_to_string (error_value);
  jerry_size_t err_str_size = jerry_get_string_size (err_str_val);
  jerry_char_t err_str_buf[256];

  if (err_str_size >= 256)
  {
    const char msg[] = "[Error message too long]";
    err_str_size = sizeof (msg) / sizeof (char) - 1;
    memcpy (err_str_buf, msg, err_str_size);
  }
  else
  {
    jerry_size_t sz = jerry_string_to_char_buffer (err_str_val, err_str_buf, err_str_size);
    assert (sz == err_str_size);
    err_str_buf[err_str_size] = 0;

    if (jerry_is_feature_enabled (JERRY_FEATURE_ERROR_MESSAGES)
        && jerry_get_error_type (error_value) == JERRY_ERROR_SYNTAX)
    {
      unsigned int err_line = 0;
      unsigned int err_col = 0;

      /* 1. parse column and line information */
      for (jerry_size_t i = 0; i < sz; i++)
      {
        if (!strncmp ((char *) (err_str_buf + i), "[line: ", 7))
        {
          i += 7;

          char num_str[8];
          unsigned int j = 0;

          while (i < sz && err_str_buf[i] != ',')
          {
            num_str[j] = (char) err_str_buf[i];
            j++;
            i++;
          }
          num_str[j] = '\0';

          err_line = (unsigned int) strtol (num_str, NULL, 10);

          if (strncmp ((char *) (err_str_buf + i), ", column: ", 10))
          {
            break; /* wrong position info format */
          }

          i += 10;
          j = 0;

          while (i < sz && err_str_buf[i] != ']')
          {
            num_str[j] = (char) err_str_buf[i];
            j++;
            i++;
          }
          num_str[j] = '\0';

          err_col = (unsigned int) strtol (num_str, NULL, 10);
          break;
        }
      } /* for */

      if (err_line != 0 && err_col != 0)
      {
        unsigned int curr_line = 1;

        bool is_printing_context = false;
        unsigned int pos = 0;

        /* 2. seek and print */
        while (buffer[pos] != '\0')
        {
          if (buffer[pos] == '\n')
          {
            curr_line++;
          }

          if (err_line < SYNTAX_ERROR_CONTEXT_SIZE
              || (err_line >= curr_line
                  && (err_line - curr_line) <= SYNTAX_ERROR_CONTEXT_SIZE))
          {
            /* context must be printed */
            is_printing_context = true;
          }

          if (curr_line > err_line)
          {
            break;
          }

          if (is_printing_context)
          {
            jerry_port_log (JERRY_LOG_LEVEL_ERROR, "%c", buffer[pos]);
          }

          pos++;
        }

        jerry_port_log (JERRY_LOG_LEVEL_ERROR, "\n");

        while (--err_col)
        {
          jerry_port_log (JERRY_LOG_LEVEL_ERROR, "~");
        }

        jerry_port_log (JERRY_LOG_LEVEL_ERROR, "^\n");
      }
    }
  }

  jerry_port_log (JERRY_LOG_LEVEL_ERROR, "Script Error: %s\n", err_str_buf);
  jerry_release_value (err_str_val);
} /* print_unhandled_exception */

/**
 * Register a JavaScript function in the global object.
 */
static void
register_js_function (const char *name_p, /**< name of the function */
                      jerry_external_handler_t handler_p) /**< function callback */
{
  jerry_value_t result_val = jerryx_handler_register_global ((const jerry_char_t *) name_p, handler_p);

  if (jerry_value_has_error_flag (result_val))
  {
    jerry_port_log (JERRY_LOG_LEVEL_WARNING, "Warning: failed to register '%s' method.", name_p);
    jerry_value_clear_error_flag (&result_val);
    print_unhandled_exception (result_val);
  }

  jerry_release_value (result_val);
} /* register_js_function */
/**
 * Command line option IDs
 */
typedef enum
{
  OPT_HELP,
  OPT_VERSION,
  OPT_MEM_STATS,
  OPT_PARSE_ONLY,
  OPT_SHOW_OP,
  OPT_SHOW_RE_OP,
  OPT_DEBUG_SERVER,
  OPT_DEBUG_PORT,
  OPT_DEBUGGER_WAIT_SOURCE,
  OPT_EXEC_SNAP,
  OPT_EXEC_SNAP_FUNC,
  OPT_LOG_LEVEL,
  OPT_ABORT_ON_FAIL,
  OPT_NO_PROMPT
} main_opt_id_t;

int
main (int argc,
      char **argv)
{
    /* initialize engine */
    jerry_init(JERRY_INIT_EMPTY);
    register_js_function ("assert", jerryx_handler_assert);
    register_js_function ("gc", jerryx_handler_gc);
    register_js_function ("print", jerryx_handler_print);

    jerry_value_t ret_value = jerry_create_undefined ();

    /* set up language extensions */
    initialize_all_webidl_constructs();

{
    const char *prompt = "jerry> ";
    bool is_done = false;

    while (!is_done)
    {
      uint8_t *source_buffer_tail = buffer;
      size_t len = 0;

      printf ("%s", prompt);

      /* Read a line */
      while (true)
      {
        if (fread (source_buffer_tail, 1, 1, stdin) != 1 && len == 0)
        {
          is_done = true;
	  /* ...so the next prompt is on its own line */
	  fprintf(stdout, "\n");
          break;
        }
        if (*source_buffer_tail == '\n')
        {
          break;
        }
        source_buffer_tail ++;
        len ++;
      }
      *source_buffer_tail = 0;

      if (len > 0)
      {
        /* Evaluate the line */
        jerry_value_t ret_val_eval = jerry_eval (buffer, len, false);

        if (!jerry_value_has_error_flag (ret_val_eval))
        {
          /* Print return value */
          const jerry_value_t args[] = { ret_val_eval };
          jerry_value_t ret_val_print = jerryx_handler_print (jerry_create_undefined (),
                                                              jerry_create_undefined (),
                                                              args,
                                                              1);
          jerry_release_value (ret_val_print);
          jerry_release_value (ret_val_eval);
          ret_val_eval = jerry_run_all_enqueued_jobs ();

          if (jerry_value_has_error_flag (ret_val_eval))
          {
            jerry_value_clear_error_flag (&ret_val_eval);
            print_unhandled_exception (ret_val_eval);
          }
        }
        else
        {
          jerry_value_clear_error_flag (&ret_val_eval);
          print_unhandled_exception (ret_val_eval);
        }

        jerry_release_value (ret_val_eval);
      }
    }
  }

  int ret_code = JERRY_STANDALONE_EXIT_CODE_OK;

  if (jerry_value_has_error_flag (ret_value))
  {
    jerry_value_clear_error_flag (&ret_value);
    print_unhandled_exception (ret_value);

    ret_code = JERRY_STANDALONE_EXIT_CODE_FAIL;
  }

  jerry_release_value (ret_value);

  ret_value = jerry_run_all_enqueued_jobs ();

  if (jerry_value_has_error_flag (ret_value))
  {
    jerry_value_clear_error_flag (&ret_value);
    print_unhandled_exception (ret_value);
    ret_code = JERRY_STANDALONE_EXIT_CODE_FAIL;
  }

  jerry_release_value (ret_value);

  jerry_cleanup ();

  return ret_code;
} /* main */
