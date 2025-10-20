import { ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";

const suggestions = [
  {
    text: "Bing",
    prompt: "Otwórz przeglądarkę i włącz https://www.bing.com/?cc=pl",
  },
  // {
  //   text: "search google for cute dogs",
  //   prompt: "Launch browser and search Google for labradoodle puppies. Show me images.",
  // },
  {
    text: "Oferta T-Mobile",
    prompt: "Znajdź ofertę Magenta TV od T-Mobile'",
  },
  // {
  //   text: "Check system memory usage",
  //   prompt: "Run the top command to show system resource usage",
  // },
  {
    text: "Github",
    prompt: "Wejdź na Github",
  },
  // {
  //   text: "What do you see",
  //   prompt:
  //     "Capture a screenshot of the current screen and tell me what you see",
  // },
];

export const PromptSuggestions = ({
  submitPrompt,
  disabled,
}: {
  submitPrompt: (prompt: string) => void;
  disabled: boolean;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="pill"
          size="pill"
          onClick={() => submitPrompt(suggestion.prompt)}
          disabled={disabled}
        >
          <span>
            <span className="text-black text-sm">
              {suggestion.text.toLowerCase()}
            </span>
          </span>
          <ArrowUpRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3 text-zinc-500 group-hover:opacity-70" />
        </Button>
      ))}
    </div>
  );
};
