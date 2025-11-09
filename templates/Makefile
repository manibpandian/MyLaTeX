# Makefile for LaTeX document

FILE = main
LATEX = pdflatex
FLAGS = -interaction=nonstopmode -halt-on-error

all: $(FILE).pdf

$(FILE).pdf: $(FILE).tex
	$(LATEX) $(FLAGS) $(FILE).tex
	$(LATEX) $(FLAGS) $(FILE).tex  # Run twice for references to settle

clean:
	rm -f $(FILE).aux $(FILE).log $(FILE).out $(FILE).toc $(FILE).pdf
